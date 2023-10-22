// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {Inventory} from "./Inventory.sol";
import {CardsCollection, Stats} from "./CardsCollection.sol";
import {PlonkVerifier as DrawVerifier} from "./verifiers/DrawVerifier.sol";
import {PlonkVerifier as DrawHandVerifier} from "./verifiers/DrawHandVerifier.sol";
import {PlonkVerifier as PlayVerifier} from "./verifiers/PlayVerifier.sol";

// Data + logic to play a game.
// NOTE: We try to lay the groundwork to support games with over 2 players, however they are not
//   supported and will not work in the current state.
contract Game {
    // =============================================================================================
    // ERRORS

    // TODO This is an error from the inventory contract, but we need to reproduce it here
    //      so that it is included in the ABI, which allows the frontend to parse the error.
    //      We need to figure out a way to systematically import all errors that we may revert with
    //      from other contracts.
    // Using an unknown deck ID.
    error DeckDoesNotExist(address player, uint8 deckID);

    // The game doesn't exist or has already ended.
    error NoGameNoLife();

    // The game hasn't started yet (at least one player hasn't joined or drawn his initial hand).
    error FalseStart();

    // Trying to take an action when it's not your turn.
    error WrongPlayer();

    // Player is trying to take a game action but hasn't drawn his initial hand yet.
    error PlayerHasntDrawn();

    // Trying to take a game action that is not allowed right now.
    error WrongStep();

    // Trying to start a game with fewer than 2 people.
    error YoullNeverPlayAlone();

    // Trying to create a game while already being in one.
    error OvereagerCreator();

    // Game creators didn't supply the same number of decks than the number of players.
    error WrongNumberOfDecks();

    // Trying to join or decline a game that you already joined.
    error AlreadyJoined();

    // Trying to draw an initial hand again.
    error AlreadyDrew();

    // Trying to cancel a game you didn't create.
    error OvereagerCanceller();

    // Trying to join a full game (total number of players reached).
    error GameIsFull();

    // Trying to cancel or join a game where all the players have already joined.
    // (We don't use the term "started", which we reserve for when all players have drawn their
    // initial hand.)
    error GameAlreadyLocked();

    // Trying to do actions in a game that has already ended.
    error GameAlreadyEnded();

    // ZK proof didn't verify.
    error WrongProof();

    // Attempt to join game was rejected by the join check.
    error NotAllowedToJoin();

    // Trying to concede a game that you are not participating in.
    error PlayerNotInGame();

    // Trying to play a card whose index is invalid (bigger than card array size).
    error CardIndexTooHigh();

    // Trying to attack a player whose index is out of range, or trying to attack oneself.
    error WrongAttackTarget();

    // Signals that an attacker was specified that is not on the player's battlefield.
    error AttackerNotOnBattlefield();

    // Mismatch between the number of specified attackers and defenders.
    error AttackerDefenderMismatch();

    // Specifiying the same attacking creature multiple time.
    error DuplicateAttacker();

    // Specifiying the same defending creature multiple time.
    error DuplicateDefender();

    // Specifying a defender with an index bigger than the number of creatures on the battlefield.
    error DefenderIndexTooHigh(uint8 index);

    // Specifying an attacker with an index bigger than the number of attacking creatures.
    error AttackerIndexTooHigh(uint8 index);

    // Signals that a defender was specified that is not on the player's battlefield.
    error DefenderNotOnBattlefield();

    // Trying to defend with an attacker (on the battlefield at the given index).
    error DefenderAttacking(uint8 index);

    // ZK proof generated is incorrect
    error InvalidProof();

    // Trying to boot a timed out player when the timeout hasn't elapsed yet.
    error GameNotTimedOut();

    // Should only revert with this error if the implementation is erroneous.
    error ImplementationError();

    // =============================================================================================
    // EVENTS

    // Replace player indexes in all of those by addresses.

    // NOTE(norswap): we represented players as an address when the event can contribute to their
    //  match stats, and as a uint8 index when these are internal game events.

    // The player took to long to submit an action and lost as a consequence.
    event PlayerTimedOut(uint256 indexed gameID, address indexed player);

    // Not all players joined and drew their hands within the time limit, the game is cancelled
    // as a consequence.
    event MissingPlayers(uint256 indexed gameID);

    // A game was created by the given creator.
    event GameCreated(uint256 gameID, address indexed creator);

    // The game was cancelled by its creator before it is started.
    event GameCancelled(uint256 indexed gameID);

    // A player joined the game.
    event PlayerJoined(uint256 indexed gameID, address player);

    // A player drew his initial hand.
    event PlayerDrewHand(uint256 indexed gameID, address player);

    // All players joined (total number of players reached).
    // A game can be cancelled by its creator up until this point.
    event FullHouse(uint256 indexed gameID);

    // The game started (all players joined + drew their initial hands).
    event GameStarted(uint256 indexed gameID);

    // A player drew a card.
    event CardDrawn(uint256 indexed gameID, uint8 player);

    // A player played a card.
    event CardPlayed(uint256 indexed gameID, uint8 player, uint256 card);

    // A player attacked another player.
    event PlayerAttacked(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A player defended against another player.
    event PlayerDefended(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A player ended his turn without attacking.
    event PlayerPassed(uint256 indexed gameID, uint8 player);

    // Someone won!
    event Champion(uint256 indexed gameID, address indexed player);

    // The player conceded the game.
    event PlayerConceded(uint256 indexed gameID, address indexed player);

    // A creature was destroyed at the given index in the attacker/defender's battlefield.
    // The battlefield index matches the battlefield before the battle (defender defending),
    // which will not match the on-chain battlefield after the battle (because the destroyed
    // creatures are removed).
    event CreatureDestroyed(uint256 indexed gameID, address player, uint8 cardIndex);

    // A player was defeated by an ennemy attack.
    event PlayerDefeated(uint256 indexed gameID, address indexed player);

    // =============================================================================================
    // CONSTANTS

    uint8 private constant INITIAL_HAND_SIZE = 7;

    uint16 private constant STARTING_HEALTH = 20;

    // Marks the absence of index inside an index array.
    uint8 private constant NONE = 255;

    // =============================================================================================
    // TYPES

    // Action that can be taken in the game.
    enum GameStep {
        UNINITIALIZED,
        DRAW,
        PLAY,
        ATTACK,
        DEFEND,
        PASS,
        ENDED
    }

    // Per-player game data.
    struct PlayerData {
        uint16 health;
        bool defeated;
        uint8 deckStart;
        uint8 deckEnd;
        uint8 handSize;
        // The block number at which the player's joinGame transaction landed.
        // NOTE: Since this is only used at the start of the game, it could be packed into another
        //       uint256 value (e.g. battlefield).
        uint256 joinBlockNum;
        // Hash of a secret salt value that the players uses to generate the hand and deck roots.
        uint256 saltHash;
        // A hash of the content of the player's hand + the player's secret salt.
        bytes32 handRoot;
        // A hash of the content of the player's deck + the player's secret salt.
        bytes32 deckRoot;
        // Bitfield of cards in the player's battlefield, for each bit: 1 if the card at the same
        // index as the bit in `GameData.cards` is on the battlefield, 0 otherwise.
        uint256 battlefield;
        // Bitfield of cards in the player's graveyard (same thing as `battlefield`).
        uint256 graveyard;
        uint8[] attacking;
    }

    // All the data for a single game instance.
    struct GameData {
        address gameCreator;
        mapping(address => PlayerData) playerData;
        address[] players;
        // Last block number at which the game data changed, updated in player actions via the
        // `step` modifier, as well as in createGame, joinGame, cancelGame and concedeGame.
        uint256 lastBlockNum;
        uint8 playersLeftToJoin;
        uint8[] livePlayers;
        function (uint256, address, uint8, bytes memory) external returns (bool) joinCheck;
        uint8 currentPlayer;
        GameStep currentStep;
        address attackingPlayer;
        // Array of playable cards in this game (NFT IDs) — concatenation of players' initial decks
        // used in this game.
        uint256[] cards;
    }

    // A read-friendly version of `GameData`, adding the gameID, flattening the player data into an
    // arary, excluding the joinCheck predicate, as well as the cards array that never changes. Use
    // `getCards()` to read them instead.
    struct FetchedGameData {
        uint256 gameID;
        address gameCreator;
        address[] players;
        PlayerData[] playerData;
        uint256 lastBlockNum;
        uint256 publicRandomness;
        uint8 playersLeftToJoin;
        uint8[] livePlayers;
        uint8 currentPlayer;
        GameStep currentStep;
        address attackingPlayer;
        uint256[] cards;
    }

    // =============================================================================================
    // FIELDS

    // Game IDs are attributed sequentially. Reserve 0 to stipulate absence of game.
    uint256 private nextID = 1;

    // Boolean to indicate whether we should check zk proof.
    bool private checkProofs;

    // Maps game IDs to game data.
    mapping(uint256 => GameData) public gameData;

    // Maps players to the game they're currently in.
    mapping(address => uint256) public inGame;

    // The inventory containing the cards that will be used in this game.
    Inventory public inventory;

    // The NFT collection that contains all admissible cards for use  in this game.
    CardsCollection public cardsCollection;

    DrawVerifier public drawVerifier;
    PlayVerifier public playVerifier;
    DrawHandVerifier public drawHandVerifier;

    // =============================================================================================
    // CONSTANTS

    // The prime that bounds the field used by our proof scheme of choice.
    // Currently, this is for Plonk.
    uint256 private constant PROOF_CURVE_ORDER =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // =============================================================================================
    // MODIFIERS

    // Check that the game exists (has been created and is not finished).
    modifier exists(uint256 gameID) {
        if (gameData[gameID].lastBlockNum == 0) {
            revert NoGameNoLife();
        }
        _;
    }

    // ---------------------------------------------------------------------------------------------

    // Checks that the game exists, that the requested step is compatible with the game state, and
    // that the next player is the message sender.
    modifier step(uint256 gameID, GameStep requestedStep) {
        // NOTE(norswap): This whole function is pretty fragile and must be revisited whenever the
        //   the step structure changes.

        // TODO(LATER) Current limitations to remove:
        // - Only one card may be played every turn.
        // - Cards can only be played before attacking, not after.

        GameData storage gdata = gameData[gameID];

        // Store this now so that we can check if the current player was defeated after the action.
        uint8 currentPlayer = gdata.currentPlayer;

        if (gdata.lastBlockNum == 0) {
            revert NoGameNoLife();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            revert FalseStart();
        }
        if (gdata.currentStep == GameStep.ENDED) {
            revert GameAlreadyEnded();
        }
        if (gdata.players[gdata.currentPlayer] != msg.sender) {
            revert WrongPlayer();
        }
        if (block.number > 256 && gdata.lastBlockNum < block.number - 256) {
            // TODO(LATER): This is the max timeout, make shorter + implement a chess clock.
            // Action timed out: the player loses.
            address timedOutPlayer = gdata.players[gdata.currentPlayer];
            emit PlayerTimedOut(gameID, timedOutPlayer);
            playerDefeated(gameID, timedOutPlayer);
            return;
        }

        // TODO: Should we explicitly prevent multiple actions on the same block?
        //       In principle, they will either fail (can't get randomness because it will depend on
        //       the current block's hash) or succeed without hurdle (e.g. player 2 defending in the
        //       same block as player 1 attacking, because someone crafted a bot that is able to
        //       read the info from the mempool & react quickly. But maybe it's better to be
        //       conservative and avoid future problems arising from hidden assumptions.

        if (gdata.currentStep == GameStep.PLAY) {
            if (requestedStep != GameStep.PLAY && requestedStep != GameStep.ATTACK && requestedStep != GameStep.PASS) {
                revert WrongStep();
            }
        } else if (gdata.currentStep == GameStep.ATTACK) {
            if (requestedStep != GameStep.ATTACK && requestedStep != GameStep.PASS) {
                revert WrongStep();
            }
        } else if (gdata.currentStep != requestedStep) {
            revert WrongStep();
        }

        _;

        if (!gdata.playerData[gdata.players[currentPlayer]].defeated) {
            // If the current player was defeated, we already shifted `gdata.currentPlayer` and
            // `gdata.currentStep` in the `playerDefeated` function, so this is uneccessary.

            if (requestedStep == GameStep.DRAW) {
                gdata.currentStep = GameStep.PLAY;
            } else if (requestedStep == GameStep.PLAY) {
                gdata.currentStep = GameStep.ATTACK;
            } else if (requestedStep == GameStep.ATTACK) {
                gdata.currentStep = GameStep.DEFEND;
                gdata.currentPlayer = nextPlayer(gdata);
            } else if (requestedStep == GameStep.DEFEND) {
                gdata.currentStep = GameStep.DRAW; // enum wraparound
            } else if (requestedStep == GameStep.PASS) {
                gdata.currentStep = GameStep.DRAW;
                gdata.currentPlayer = nextPlayer(gdata);
            }
        }

        gdata.lastBlockNum = block.number;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the next player in the game (index in `gdata.players`). This relies on
    // `gdata.currentPlayer` pointing to a player whose index is still present in
    // `gdata.livePlayers`.
    function nextPlayer(GameData storage gdata) internal view returns (uint8) {
        uint8 currentPlayer = gdata.currentPlayer;
        for (uint256 i = 0; i < gdata.livePlayers.length; ++i) {
            if (gdata.livePlayers[i] == currentPlayer) {
                return gdata.livePlayers[(i + 1) % gdata.livePlayers.length];
            }
        }
        revert ImplementationError();
    }

    // =============================================================================================

    constructor(
        Inventory inventory_,
        DrawVerifier drawVerifier_,
        PlayVerifier playVerifier_,
        DrawHandVerifier drawHandVerifier_,
        bool checkProofs_
    ) {
        inventory = inventory_;
        cardsCollection = inventory.originalCardsCollection();
        drawVerifier = drawVerifier_;
        playVerifier = playVerifier_;
        drawHandVerifier = drawHandVerifier_;
        checkProofs = checkProofs_;
    }

    // =============================================================================================
    // VIEW FUNCTIONS

    // Returns a subset of `GameData` members, excluding non-readable members (mapping, function),
    // and the cards array that never changes. Use `getCards()` to read them instead.
    function fetchGameData(uint256 gameID, address player, bool fetchCards)
        external
        view
        returns (FetchedGameData memory)
    {
        GameData storage gdata = gameData[gameID];

        if (gdata.lastBlockNum == 0) {
            revert NoGameNoLife();
        }

        PlayerData[] memory pData = new PlayerData[](gdata.players.length);
        for (uint8 i = 0; i < gdata.players.length; ++i) {
            pData[i] = gdata.playerData[gdata.players[i]];
        }

        return FetchedGameData({
            gameID: gameID,
            gameCreator: gdata.gameCreator,
            players: gdata.players,
            playerData: pData,
            lastBlockNum: gdata.lastBlockNum,
            publicRandomness: getPublicRandomness(gameID, player),
            playersLeftToJoin: gdata.playersLeftToJoin,
            livePlayers: gdata.livePlayers,
            currentPlayer: gdata.currentPlayer,
            currentStep: gdata.currentStep,
            attackingPlayer: gdata.attackingPlayer,
            cards: fetchCards ? gdata.cards : new uint256[](0)
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Get the cards that will be used in the game. The results of this are undefined before the
    // game is started (i.e. the final player set is known).
    function getCards(uint256 gameID) external view returns (uint256[] memory) {
        return gameData[gameID].cards;
    }

    // ---------------------------------------------------------------------------------------------

    function playerData(uint256 gameID, address player) external view returns (PlayerData memory) {
        return gameData[gameID].playerData[player];
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the current public randomness for the game & player (if specified) — used to draw
    // cards.
    //
    // Note: the frontend never calls this directly, but via `fetchGameData(...)`. It may also
    // compute this value itself, which it needs to do when `gdata.lastBlockNum` is the last block
    // (and `pdata.lastBlockNum` can't be used or is the same), in which case the corresponding
    // blockhash will evaluate to 0 (stupid, but that's how nodes do it).
    //
    // This can also return 0 in case of a timeout. In this scenario, anyone can call the
    // `timeout()` function to boot the timed out player from the game, or cancel the game if not
    // everyone joined and drew the initial hand yet.
    function getPublicRandomness(uint256 gameID, address player) public view returns (uint256) {

        // When the player is specified, they're in the game and their hand hasn't been drawn yet,
        // we set the publicRandomness based on the block at which their joinGame transaction was
        // received. This enables all players to draw their hands and generate the zk proof locally,
        // without incurring race conditions between players.
        //
        // This is currently the only time in the game when player can perform concurrent
        // randomness-dependent actions.

        GameData storage gdata = gameData[gameID];
        if (player != address(0)) { // player specified
            PlayerData storage pdata = gdata.playerData[player];
            if (pdata.saltHash != 0 && pdata.handRoot == 0) {
                // player in the game & hand not drawn yet
                return uint256(blockhash(pdata.joinBlockNum)) % PROOF_CURVE_ORDER;
            }
        }
        return uint256(blockhash(gdata.lastBlockNum)) % PROOF_CURVE_ORDER;
    }

    // ---------------------------------------------------------------------------------------------

    // Slightly more efficient internal version of `getPublicRandomness` for use when drawing
    // the initial hand.
    function getPubRandomnessForInitialHand(uint256 joinBlockNum) internal view returns (uint256) {
        return uint256(blockhash(joinBlockNum)) % PROOF_CURVE_ORDER;
    }

    // ---------------------------------------------------------------------------------------------

    // Slightly more efficient internal version of `getPublicRandomness` for use after the game
    // has started.
    function getPubRandomness(uint256 lastBlockNum) internal view returns (uint256) {
        return uint256(blockhash(lastBlockNum)) % PROOF_CURVE_ORDER;
    }
    // ---------------------------------------------------------------------------------------------

    // Returns the given player's deck listing.
    function playerDeck(uint256 gameID, address player) public view exists(gameID) returns (uint256[] memory) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[player];
        return playerDeck(gdata, pdata);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the given player's deck listing.
    function playerDeck(GameData storage gdata, PlayerData storage pdata) internal view returns (uint256[] memory) {
        uint256[] memory deck = new uint256[](pdata.deckEnd - pdata.deckStart);
        for (uint256 i = 0; i < deck.length; ++i) {
            deck[i] = gdata.cards[pdata.deckStart + i];
        }
        return deck;
    }

    // =============================================================================================
    // FUNCTIONS

    // ---------------------------------------------------------------------------------------------

    // To be used as callback for `createGame`, allow any player to join with any deck.
    function allowAnyPlayerAndDeck(uint256, /*gameID*/ address, /*player*/ uint8, /*deckID*/ bytes memory /*data*/ )
        external
        pure
        returns (bool)
    {
        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Starts a game for the given number of players (only works for 2 currently) with a function to
    // check if a given player is allowed to join. For testing purposes, you can use the
    // `allowAnyPlayerInDeck` function in this contract. Joining the game must happen on a later
    // block than starting the game.
    function createGame(uint8 numberOfPlayers)
        // TODO this is very hard to encode in wagmi/ethers
        // , function (uint256, address, uint8, bytes memory) external returns (bool) joinCheck
        external
        returns (uint256 gameID)
    {
        unchecked {
            // for gas efficiency lol
            gameID = nextID++;
        }

        if (inGame[msg.sender] != 0) {
            revert OvereagerCreator();
        }

        if (numberOfPlayers < 2) {
            revert YoullNeverPlayAlone();
        }

        GameData storage gdata = gameData[gameID];
        gdata.gameCreator = msg.sender;
        gdata.playersLeftToJoin = numberOfPlayers;
        gdata.lastBlockNum = block.number;

        // TODO
        // gdata.joinCheck = joinCheck;
        gdata.joinCheck = this.allowAnyPlayerAndDeck;

        // `gdata.players` is filled as players join.
        // `gdata.currentPlayer` is initialized when the game is started. This needs to happen in
        // another block so that the blockhash of this block can be used as randomness.

        emit GameCreated(gameID, msg.sender);
    }

    // ---------------------------------------------------------------------------------------------

    // Clear (zero) the contents of the array and make it zero-sized.
    function clear(uint8[] storage array) internal {
        // TODO should be done in assembly, avoiding to overwrite the size on every pop
        for (uint256 i = 0; i < array.length; ++i) {
            array.pop();
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Deletes the game that we do not need anymore.
    // TODO: think about we might want to keep or not
    function deleteGame(GameData storage gdata, uint256 /*gameID*/ ) internal {
        // clear cards
        for (uint256 i = 0; i < gdata.cards.length; ++i) {
            delete gdata.cards[i];
        }

        // clear players and player data
        for (uint256 i = 0; i < gdata.players.length; ++i) {
            PlayerData storage pdata = gdata.playerData[gdata.players[i]];
            clear(pdata.attacking);
            delete gdata.playerData[gdata.players[i]];

            // NOTE: See note below.
            // delete gdata.players[i];
        }

        // NOTE: Keeping the static game data makes it easier for the client to handle the end
        // of the game gracefully, for now.
        // delete gameData[gameID];
    }

    // ---------------------------------------------------------------------------------------------

    // TODO(LATER): Clear data for games that were created but never started.
    //   - Could let anybody do it - it's beneficial because of gas rebates.
    //   - Just track game created but not started per creation block and enforce a timeout.

    // ---------------------------------------------------------------------------------------------

    // Cancel a game you created, before all players have joined.
    function cancelGame(uint256 gameID) external {
        GameData storage gdata = gameData[gameID];
        if (gdata.gameCreator != msg.sender) {
            revert OvereagerCanceller();
        }
        if (gdata.playersLeftToJoin == 0) {
            revert GameAlreadyLocked();
        }
        emit GameCancelled(gameID);
        endGameBeforeStart(gameID, gdata);
    }

    // ---------------------------------------------------------------------------------------------

    function endGameBeforeStart(uint256 gameID, GameData storage gdata) internal {
        deleteGame(gdata, gameID);
        for (uint256 i = 0; i < gdata.players.length; ++i) {
            delete inGame[gdata.players[i]];
        }
        gdata.lastBlockNum = block.number;
        gdata.currentStep = GameStep.ENDED;
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `pdata.handRoot` is a merkle root of 7 cards drawn from the player's deck
    // according to `randomness`, and that `pdata.deckRoot` contains the initial player's deck
    // cards, minus the cards drawn, in order, but updated using fast array removal
    // (swap removed card with last card, and truncate the array by one).
    //
    // The player's deck is cards[pdata.deckStart:pdata.deckEnd].
    function checkInitialHandProof(
        PlayerData storage pdata,
        uint256 randomness,
        uint256 saltHash,
        uint256[24] memory proof
    ) internal view {
        if (address(drawVerifier) == address(0)) return;

        // - The proof requires a deck packed onto two field elements.
        // - We obtain it by write the index of each card in the `gdata.cards` array to a byte
        //   of the field elements.
        // - A field element (felt) can hold 31 bytes, so we pack 31 cards per field element.
        // - We pad the rest of the bytes with 255, representing the absence of cards.
        // - The cards are written in little-endian order (first card = low-order byte), with the
        //   first 31 bytes packed into the first field element.
        //  - Because we're using the initial deck ordering for this proof, the indexes are
        //    sequential: [pdata.deckStart, pdata.deckEnd).

        uint256 maxDeckSize = inventory.MAX_DECK_SIZE();
        assert(maxDeckSize <= 62);
        uint256 deckStart = pdata.deckStart;
        uint256 deckEnd = pdata.deckEnd;
        uint256 deckLength = deckEnd - deckStart;
        uint256[2] memory packedDeck;

        for (uint256 i = 0; i < deckLength; ++i) {
            uint256 feltIndex = i / 31; // [0, 30] in 0, [31, 61] in 1
            uint256 byteIndex = i % 31;
            // packedDeck[feltIndex][byteIndex] = deckStart + i;
            packedDeck[feltIndex] |= (deckStart + i) << (8 * byteIndex);
        }
        for (uint256 i = deckLength; i < maxDeckSize; ++i) {
            uint256 feltIndex = i / 31; // [0, 30] in 0, [31, 61] in 1
            uint256 byteIndex = i % 31;
            // packedDeck[feltIndex][byteIndex] = 255;
            packedDeck[feltIndex] |= 255 << (8 * byteIndex);
        }

        // construct circuit public signals
        uint256[7] memory pubSignals;

        pubSignals[0] = packedDeck[0];
        pubSignals[1] = packedDeck[1];
        pubSignals[2] = deckLength - 1; // last index
        pubSignals[3] = uint256(pdata.deckRoot);
        pubSignals[4] = uint256(pdata.handRoot);
        pubSignals[5] = saltHash;
        pubSignals[6] = randomness;

        if (checkProofs) {
            if (!drawHandVerifier.verifyProof(proof, pubSignals)) {
                revert InvalidProof();
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Joins a game that the player can participate in, but hasn't joined yet.
    // The player must be allowed to join according to `gdata.joinCheck`, to which the `data`
    // parameter is passed. (This check is ignored for now — any player can join any game.)
    //
    // This function specifies the deck to use to use as well a the hash of a secret salt value
    // used in zero-knowledge proofs.
    //
    // To start the game, the player must call `drawInitialHand`.
    function joinGame(uint256 gameID, uint8 deckID, uint256 saltHash, bytes calldata data) external exists(gameID) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        if (pdata.joinBlockNum != 0) {
            revert AlreadyJoined();
        }
        if (gdata.playersLeftToJoin == 0) {
            revert GameIsFull();
        }
        if (!gdata.joinCheck(gameID, msg.sender, deckID, data)) {
            revert NotAllowedToJoin();
        }

        // Update gdata.players, but not gdata.livePlayers, which is used to determine if the
        // game is ready to start (all players have joined & drawn their initial hand).
        gdata.players.push(msg.sender);

        // Crucial: we don't let the player draw when he joins, because otherwise he could pick his
        // salt such that he draws a good hand. So the salt commitment must come *before* an update
        // to the randomness value (derived from the block num).
        //
        // Note that while there are ways to join + draw at the same time (e.g. salt == signature of
        // randomness, verified in a snark), it's generally indesirable because it lets players
        // simulate their hands before commiting to join a game. If they have multiple accounts,
        // they could chose the most advantageous one to join a game.

        pdata.joinBlockNum = block.number;
        // NOTE: This could be removed, its only effect at this stage is pushing back the timeout.
        gdata.lastBlockNum = block.number;

        // Add the player's cards to `gdata.cards`.
        uint256[] storage cards = gdata.cards;
        pdata.deckStart = uint8(cards.length);
        inventory.checkDeck(msg.sender, deckID);
        uint256[] memory deck = inventory.getDeck(msg.sender, deckID);

        for (uint256 i = 0; i < deck.length; i++) {
            cards.push(deck[i]);
        }
        pdata.deckEnd = uint8(cards.length);

        pdata.saltHash = saltHash;
        pdata.health = STARTING_HEALTH;

        inGame[msg.sender] = gameID;
        emit PlayerJoined(gameID, msg.sender);
        if (--gdata.playersLeftToJoin == 0) {
            emit FullHouse(gameID);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Supplies commitments to the player's initial hand, and deck after drawing this hand, as well
    // as a zero-knowledge proof that the correct cards were drawn and the correct commitment was
    // generated given on-chain randomness and the player's secret salt.
    //
    // This can be called after joining the game, and must be called by all players before the game
    // can start.
    function drawInitialHand(uint256 gameID, bytes32 handRoot, bytes32 deckRoot, uint256[24] memory proof)
        external
        exists(gameID)
    {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        if (pdata.joinBlockNum == 0) {
            revert PlayerNotInGame();
        }
        if (pdata.handRoot != 0) {
            revert AlreadyDrew();
        }

        pdata.handRoot = handRoot;
        pdata.deckRoot = deckRoot;
        pdata.handSize = INITIAL_HAND_SIZE;

        uint256 randomness = getPubRandomnessForInitialHand(pdata.joinBlockNum);
        checkInitialHandProof(pdata, randomness, pdata.saltHash, proof);

        // Add the player to the list of live players.
        // Note that this loop is cheaper than passing the index to the function, as calldata is
        // expensive on layer 2 rollups.
        for (uint256 i = 0; i < gdata.players.length; i++) {
            if (gdata.players[i] == msg.sender) {
                gdata.livePlayers.push(uint8(i));
                break;
                // There will always be a match because we checked that the player is in the game.
            }
        }

        emit PlayerDrewHand(gameID, msg.sender);

        // NOTE: We're not updating gdata.lastBlockNum until the game starts. This means that all
        // players must join within a 256-block window or they won't be able to get the blockhash to
        // generate the randomness. In that case, anybody can call `timeout()` to cancel the game.

        if (gdata.playersLeftToJoin == 0 && gdata.players.length == gdata.livePlayers.length) {
            // Start the game!
            gdata.currentPlayer = uint8(randomness % gdata.players.length);
            gdata.currentStep = GameStep.PLAY; // first player doesn't draw
            gdata.lastBlockNum = block.number;
            emit GameStarted(gameID);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Function to be called after a player's health drops to 0, to check if only one player is
    // left, in which case an event is emitted and the game data is deleted.
    function maybeEndGame(GameData storage gdata, uint256 gameID) internal {
        // TODO
        //   In the future, consider the possibility of a draw if an effect were to reduce
        //   the health of all remaining players to 0 at the same time.
        if (gdata.livePlayers.length == 1) {
            address winner = gdata.players[gdata.livePlayers[0]];
            delete inGame[winner];
            deleteGame(gdata, gameID);
            gdata.currentStep = GameStep.ENDED;
            emit Champion(gameID, winner);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Let a player concede defeat.
    function concedeGame(uint256 gameID) public exists(gameID) {
        GameData storage gdata = gameData[gameID];
        if (gdata.playerData[msg.sender].handRoot == 0) {
            revert PlayerNotInGame();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            revert FalseStart();
        }
        emit PlayerConceded(gameID, msg.sender);
        playerDefeated(gameID, msg.sender);
        gdata.lastBlockNum = block.number;
    }

    // ---------------------------------------------------------------------------------------------

    // Anybody can call this function to make a player that timed out (did not take an action within
    // the time limit) lose, or to cancel a game where not all the players joined within the time
    // limit.
    //
    // Note that in the first scenario, the timed out player will lose anyway if he tries to take an
    // action.
    function timeout(uint256 gameID) external exists(gameID) {
        GameData storage gdata = gameData[gameID];
        if (gdata.lastBlockNum > block.number - 256) {
            revert GameNotTimedOut();
        }
        if (gdata.currentStep == GameStep.ENDED) {
            revert GameAlreadyEnded();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            emit MissingPlayers(gameID);
            endGameBeforeStart(gameID, gdata);
        } else {
            address timedOutPlayer = gdata.players[gdata.currentPlayer];
            emit PlayerTimedOut(gameID, timedOutPlayer);
            playerDefeated(gameID, timedOutPlayer);
            gdata.lastBlockNum = block.number;
        }
    }

    // ---------------------------------------------------------------------------------------------

    function playerDefeated(uint256 gameID, address player) internal {
        GameData storage gdata = gameData[gameID];

        if (gdata.players[gdata.currentPlayer] == player) {
            // If the current player was defeated, shift next step and player.
            // We need to do this before we remove the current player from `gdata.livePlayers`.
            gdata.currentPlayer = nextPlayer(gdata);
            gdata.currentStep = GameStep.DRAW;
        }

        // TODO: Move this out to a library, turn it to a uint8[32] bespoke data type that stores length in first slot?
        //       This would enable to perform this in a single shift once the player is found.
        // Remove the player from the livePlayers array.
        // This is safe because we ascertained the player is in the game.
        bool shifting = false;
        uint8[] storage livePlayers = gdata.livePlayers;
        for (uint256 i = 0; i < livePlayers.length - 1; i++) {
            if (gdata.players[livePlayers[i]] == player) {
                shifting = true;
            }
            if (shifting) {
                livePlayers[i] = livePlayers[i + 1];
            }
        }
        livePlayers.pop();

        PlayerData storage pdata = gdata.playerData[player];
        pdata.defeated = true;

        if (pdata.health == 0) {
            // If health is not zero, the player conceded or timed out,
            // and different events are emitted for that.
            emit PlayerDefeated(gameID, player);
        }

        delete inGame[player];
        maybeEndGame(gdata, gameID);
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `handRoot` is a correctly updated version of `pdata.handRoot`, adding a card drawn
    // according to `randomness`, and that `deckRoot` is a correctly updated version of
    // `pdata.deckRoot`, that removes the drawn card from the deck using fast array removal (swap
    // removed card with last card, and truncate the array by one).
    function checkDrawProof(
        PlayerData storage pdata,
        bytes32 handRoot,
        bytes32 deckRoot,
        uint256 saltHash,
        uint256 randomness,
        uint256[24] memory proof
    ) internal view {
        if (address(drawVerifier) == address(0)) return;

        uint256[8] memory pubSignals;
        pubSignals[0] = uint256(pdata.deckRoot);
        pubSignals[1] = uint256(deckRoot);
        pubSignals[2] = uint256(pdata.handRoot);
        pubSignals[3] = uint256(handRoot);
        pubSignals[4] = saltHash;
        pubSignals[5] = randomness;
        pubSignals[6] = pdata.handSize;
        pubSignals[7] = pdata.deckEnd - pdata.deckStart; // last index

        if (checkProofs) {
            if (!drawVerifier.verifyProof(proof, pubSignals)) {
                revert InvalidProof();
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Submit updated hand and deck roots after having drawn a card from the deck.
    function drawCard(uint256 gameID, bytes32 handRoot, bytes32 deckRoot, uint256[24] memory proof)
        external
        step(gameID, GameStep.DRAW)
    {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        uint256 randomness = getPubRandomness(gdata.lastBlockNum);
        checkDrawProof(pdata, handRoot, deckRoot, pdata.saltHash, randomness, proof);
        pdata.handRoot = handRoot;
        pdata.deckRoot = deckRoot;
        pdata.handSize++;
        emit CardDrawn(gameID, gdata.currentPlayer);

        // TODO(LATER) if you can't draw you lose the game!
    }

    // ---------------------------------------------------------------------------------------------

    function pass(uint256 gameID) external step(gameID, GameStep.PASS) {
        // empty: everything happens in the step function
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `card` was contained within `pdata.handRoot` and that `handRoot` is a correctly
    // updated version of `pdata.handRoot`, without `card`, removed using fast array removal.
    function checkPlayProof(
        PlayerData storage pdata,
        bytes32 handRoot,
        uint256 saltHash,
        uint256 randomness,
        uint256 card,
        uint256[24] memory proof
    ) internal view {
        if (address(playVerifier) == address(0)) return;

        uint256[6] memory pubSignals;
        pubSignals[0] = uint256(pdata.handRoot);
        pubSignals[1] = uint256(handRoot);
        pubSignals[2] = saltHash;
        pubSignals[3] = randomness;
        pubSignals[4] = pdata.handSize - 1; // last index
        pubSignals[5] = card;

        if (checkProofs) {
            if (!playVerifier.verifyProof(proof, pubSignals)) {
                revert InvalidProof();
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Play the given card (index into `gameData.cards`).
    function playCard(uint256 gameID, bytes32 handRoot, uint8 cardIndex, uint256[24] memory proof)
        external
        step(gameID, GameStep.PLAY)
    {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        if (cardIndex > gdata.cards.length) {
            revert CardIndexTooHigh();
        }
        uint256 card = gdata.cards[cardIndex];
        uint256 randomness = getPubRandomness(gdata.lastBlockNum);
        checkPlayProof(pdata, handRoot, pdata.saltHash, randomness, card, proof);
        pdata.handRoot = handRoot;
        pdata.handSize--;
        pdata.battlefield |= 1 << cardIndex;
        emit CardPlayed(gameID, gdata.currentPlayer, card);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true iff the array contains the items.
    function contains(uint8[] storage array, uint8 item) internal view returns (bool) {
        for (uint256 i = 0; i < array.length; ++i) {
            if (array[i] == item) return true;
        }
        return false;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true iff the array contains duplicate elements (in O(n) time). 255 (NONE) is ignored.
    function hasDuplicate(uint8[] calldata array) internal pure returns (bool) {
        uint256 bitmap = 0;
        for (uint256 i = 0; i < array.length; ++i) {
            if (array[i] != NONE && (bitmap & (1 << array[i])) != 0) return true;
            bitmap |= 1 << array[i];
        }
        return false;
    }

    // ---------------------------------------------------------------------------------------------

    // Declare attackers (indexes into the `cards` array).
    function attack(uint256 gameID, uint8 targetPlayer, uint8[] calldata attacking)
        external
        step(gameID, GameStep.ATTACK)
    {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        // NOTE: This allows attacking dead player in (unsupported) games with > 2 players.
        if (gdata.currentPlayer == targetPlayer || targetPlayer > gdata.players.length) {
            revert WrongAttackTarget();
        }

        if (hasDuplicate(attacking)) {
            revert DuplicateAttacker();
        }

        for (uint256 i = 0; i < attacking.length; ++i) {
            if ((pdata.battlefield & (1 << attacking[i])) == 0) {
                revert AttackerNotOnBattlefield();
            }
        }

        clear(pdata.attacking); // Delete old attacking array.
        pdata.attacking = attacking;
        gdata.attackingPlayer = msg.sender;
        emit PlayerAttacked(gameID, msg.sender, gdata.players[targetPlayer]);
    }

    // ---------------------------------------------------------------------------------------------

    // Declare defenders & resolve combat: each creature in `defending` will block the
    // corresponding creature in the attacker's `attacking` array.
    function defend(uint256 gameID, uint8[] calldata defending) external step(gameID, GameStep.DEFEND) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage defender = gdata.playerData[msg.sender];
        PlayerData storage attacker = gdata.playerData[gdata.attackingPlayer];
        uint8[] storage attacking = attacker.attacking;

        if (attacking.length != defending.length) {
            revert AttackerDefenderMismatch();
        }

        // TODO make sure duplicate 255 are ignored
        if (hasDuplicate(defending)) {
            revert DuplicateDefender();
        }

        // iterate over attackers
        for (uint256 i = 0; i < attacking.length; ++i) {
            if (defending[i] == NONE) {
                // attacker not blocked
                uint256 attackingCard = gdata.cards[attacking[i]];
                uint8 damage = cardsCollection.stats(attackingCard).attack;
                if (defender.health <= damage) {
                    defender.health = 0;
                    playerDefeated(gameID, msg.sender);
                    break;
                } else {
                    defender.health -= damage;
                }
            } else {
                // attacker blocked
                if ((defender.battlefield & (1 << defending[i])) == 0) {
                    revert DefenderNotOnBattlefield();
                }
                if (contains(defender.attacking, defending[i])) {
                    revert DefenderAttacking(defending[i]);
                }

                Stats memory attackerStats;
                Stats memory defenderStats;
                {
                    // avoid stack too deep
                    uint256 attackingCard = gdata.cards[attacking[i]];
                    uint256 defendingCard = gdata.cards[defending[i]];
                    attackerStats = cardsCollection.stats(attackingCard);
                    defenderStats = cardsCollection.stats(defendingCard);
                }

                if (attackerStats.attack >= defenderStats.defense) {
                    defender.battlefield -= (1 << defending[i]);
                    defender.graveyard |= (1 << defending[i]);
                    emit CreatureDestroyed(gameID, msg.sender, defending[i]);
                }

                if (defenderStats.attack >= attackerStats.defense) {
                    attacker.battlefield -= (1 << attacking[i]);
                    attacker.graveyard |= (1 << attacking[i]);
                    emit CreatureDestroyed(gameID, gdata.attackingPlayer, attacking[i]);
                }
            }
        }

        emit PlayerDefended(gameID, gdata.attackingPlayer, msg.sender);
    }

    // ---------------------------------------------------------------------------------------------

    // Toggles whether to check proofs or not. Meant to be used in testing (to disable error
    // checking). This is enforced by restricting the caller to be the 0 address, which can only
    // be impersonated in a test environment.
    function toggleCheckProofs() external {
        assert(msg.sender == address(0));
        checkProofs = !checkProofs;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true if a `player` is currently in an active game
    // This works because players cannot participate in multiple games simultaneously
    function playerActive(address player) external view returns (bool) {
        return inGame[player] != 0;
    }

    // ---------------------------------------------------------------------------------------------
}
