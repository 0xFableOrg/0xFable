// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {Inventory} from "./Inventory.sol";
import {CardsCollection} from "./CardsCollection.sol";
import {Constants} from "./libraries/Constants.sol";
import {Events} from "./libraries/Events.sol";
import {Errors} from "./libraries/Errors.sol";
import {GameInternalLib} from "./libraries/GameInternalLib.sol";
import {GameStepLib} from "./libraries/GameStepLib.sol";
import {GameStep, PlayerData, GameData, FetchedGameData} from "./libraries/Structs.sol";
import {Groth16Verifier as DrawVerifier} from "./verifiers/DrawVerifier.sol";
import {Groth16Verifier as DrawHandVerifier} from "./verifiers/DrawHandVerifier.sol";
import {Groth16Verifier as PlayVerifier} from "./verifiers/PlayVerifier.sol";

// Data + logic to play a game.
// NOTE: We try to lay the groundwork to support games with over 2 players, however they are not
//   supported and will not work in the current state.
contract Game {
    using GameInternalLib for GameData;

    // =============================================================================================
    // FIELDS

    // Game IDs are attributed sequentially. Reserve 0 to stipulate absence of game.
    uint256 private nextID = 1;

    // Boolean to indicate whether we should check zk proof.
    bool private checkProofs;

    // If > 0, indicates that we should use deterministic randomness and not have timeouts.
    // The randomness is the value of this field, which increases every block it is used.
    uint256 private noRandomCounter;

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
    // MODIFIERS

    // Check that the game exists (has been created and is not finished).
    modifier exists(uint256 gameID) {
        if (gameData[gameID].lastBlockNum == 0) {
            revert Errors.NoGameNoLife();
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
            revert Errors.NoGameNoLife();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            revert Errors.FalseStart();
        }
        if (gdata.currentStep == GameStep.ENDED) {
            revert Errors.GameAlreadyEnded();
        }
        if (gdata.players[gdata.currentPlayer] != msg.sender) {
            revert Errors.WrongPlayer();
        }
        if (noRandomCounter == 0 && block.number > 256 && gdata.lastBlockNum < block.number - 256) {
            // TODO(LATER): This is the max timeout, make shorter + implement a chess clock.
            // Action timed out: the player loses.
            address timedOutPlayer = gdata.players[gdata.currentPlayer];
            emit Events.PlayerTimedOut(gameID, timedOutPlayer);
            gdata.playerDefeated(gameID, inGame, timedOutPlayer);
            return;
        }

        // TODO: Should we explicitly prevent multiple actions on the same block?
        //       In principle, they will either fail (can't get randomness because it will depend on
        //       the current block's hash) or succeed without hurdle (e.g. player 2 defending in the
        //       same block as player 1 attacking, because someone crafted a bot that is able to
        //       read the info from the mempool & react quickly. But maybe it's better to be
        //       conservative and avoid future problems arising from hidden assumptions.

        if (gdata.currentStep == GameStep.PLAY) {
            GameStep reqStep = requestedStep;
            if (reqStep != GameStep.PLAY && reqStep != GameStep.ATTACK && reqStep != GameStep.END_TURN) {
                revert Errors.WrongStep();
            }
        } else if (gdata.currentStep == GameStep.ATTACK) {
            if (requestedStep != GameStep.ATTACK && requestedStep != GameStep.END_TURN) {
                revert Errors.WrongStep();
            }
        } else if (gdata.currentStep != requestedStep) {
            revert Errors.WrongStep();
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
                gdata.currentPlayer = gdata.nextPlayer();
            } else if (requestedStep == GameStep.DEFEND) {
                gdata.currentStep = GameStep.DRAW; // enum wraparound
            } else if (requestedStep == GameStep.END_TURN) {
                gdata.currentStep = GameStep.DRAW;
                gdata.currentPlayer = gdata.nextPlayer();
            }
        }

        gdata.lastBlockNum = block.number;
    }

    // =============================================================================================

    constructor(
        Inventory inventory_,
        DrawVerifier drawVerifier_,
        PlayVerifier playVerifier_,
        DrawHandVerifier drawHandVerifier_,
        bool checkProofs_,
        bool noRandom_
    ) {
        inventory = inventory_;
        cardsCollection = inventory.originalCardsCollection();
        drawVerifier = drawVerifier_;
        playVerifier = playVerifier_;
        drawHandVerifier = drawHandVerifier_;
        checkProofs = checkProofs_;
        if (noRandom_) {
            noRandomCounter = 1;
        }
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
            revert Errors.NoGameNoLife();
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
    //
    // When the player is specified (non-0), they're in the game and their hand hasn't been drawn
    // yet, we set the publicRandomness based on the block at which their joinGame transaction was
    // received. This enables all players to draw their hands and generate the zk proof locally,
    // without incurring race conditions between players.
    //
    // This is currently the only time in the game when player can perform concurrent
    // randomness-dependent actions.
    function getPublicRandomness(uint256 gameID, address player) public view returns (uint256) {
        GameData storage gdata = gameData[gameID];
        if (player != address(0)) {
            PlayerData storage pdata = gdata.playerData[player];
            if (pdata.saltHash != 0 && pdata.handRoot == 0) {
                // joinGame received (saltHash), but drawInitialHand not received yet (handRoot)
                if (noRandomCounter > 0) {
                    // This is always 1!
                    return noRandomCounter;
                }
                return uint256(blockhash(pdata.joinBlockNum)) % Constants.PROOF_CURVE_ORDER;
            }
        }
        if (noRandomCounter > 0) {
            return noRandomCounter + 1;
        }
        return uint256(blockhash(gdata.lastBlockNum)) % Constants.PROOF_CURVE_ORDER;
    }

    // ---------------------------------------------------------------------------------------------

    // Slightly more efficient internal version of `getPublicRandomness` for use when drawing
    // the initial hand.
    function getPubRandomnessForInitialHand(uint256 joinBlockNum) internal view returns (uint256) {
        if (noRandomCounter > 0) {
            // do not increase, first increase will be before the first card played or first draw
            return noRandomCounter;
        }
        return uint256(blockhash(joinBlockNum)) % Constants.PROOF_CURVE_ORDER;
    }

    // ---------------------------------------------------------------------------------------------

    // Slightly more efficient internal version of `getPublicRandomness` for use after the game
    // has started.
    function getPubRandomness(uint256 lastBlockNum) internal returns (uint256) {
        if (noRandomCounter > 0) {
            return ++noRandomCounter;
        }
        return uint256(blockhash(lastBlockNum)) % Constants.PROOF_CURVE_ORDER;
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
            revert Errors.OvereagerCreator();
        }

        if (numberOfPlayers < 2) {
            revert Errors.YoullNeverPlayAlone();
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

        emit Events.GameCreated(gameID, msg.sender);
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
            revert Errors.OvereagerCanceller();
        }
        if (gdata.playersLeftToJoin == 0) {
            revert Errors.GameAlreadyLocked();
        }
        emit Events.GameCancelled(gameID);
        endGameBeforeStart(gameID, gdata);
    }

    // ---------------------------------------------------------------------------------------------

    function endGameBeforeStart(uint256 gameID, GameData storage gdata) internal {
        gdata.deleteGame(gameID);
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
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) internal view {
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
            if (!drawHandVerifier.verifyProof(proofA, proofB, proofC, pubSignals)) {
                revert Errors.InvalidProof();
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
            revert Errors.AlreadyJoined();
        }
        if (gdata.playersLeftToJoin == 0) {
            revert Errors.GameIsFull();
        }
        if (!gdata.joinCheck(gameID, msg.sender, deckID, data)) {
            revert Errors.NotAllowedToJoin();
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
        pdata.health = Constants.STARTING_HEALTH;

        inGame[msg.sender] = gameID;
        emit Events.PlayerJoined(gameID, msg.sender);
        if (--gdata.playersLeftToJoin == 0) {
            emit Events.FullHouse(gameID);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Supplies commitments to the player's initial hand, and deck after drawing this hand, as well
    // as a zero-knowledge proof that the correct cards were drawn and the correct commitment was
    // generated given on-chain randomness and the player's secret salt.
    //
    // This can be called after joining the game, and must be called by all players before the game
    // can start.
    function drawInitialHand(
        uint256 gameID,
        bytes32 handRoot,
        bytes32 deckRoot,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external exists(gameID) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        checkInitialHandProof(
            pdata, getPubRandomnessForInitialHand(pdata.joinBlockNum), pdata.saltHash, proofA, proofB, proofC
        );
        GameStepLib.drawInitialHand(gameID, gdata, pdata, handRoot, deckRoot, getPubRandomness(gdata.lastBlockNum));
    }

    // ---------------------------------------------------------------------------------------------

    // Let a player concede defeat.
    function concedeGame(uint256 gameID) public exists(gameID) {
        GameData storage gdata = gameData[gameID];
        if (gdata.playerData[msg.sender].handRoot == 0) {
            revert Errors.PlayerNotInGame();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            revert Errors.FalseStart();
        }
        emit Events.PlayerConceded(gameID, msg.sender);
        gdata.playerDefeated(gameID, inGame, msg.sender);
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
            revert Errors.GameNotTimedOut();
        }
        if (gdata.currentStep == GameStep.ENDED) {
            revert Errors.GameAlreadyEnded();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            emit Events.MissingPlayers(gameID);
            endGameBeforeStart(gameID, gdata);
        } else {
            address timedOutPlayer = gdata.players[gdata.currentPlayer];
            emit Events.PlayerTimedOut(gameID, timedOutPlayer);
            gdata.playerDefeated(gameID, inGame, timedOutPlayer);
            gdata.lastBlockNum = block.number;
        }
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
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) internal view {
        uint256[8] memory pubSignals;
        pubSignals[0] = uint256(pdata.deckRoot);
        pubSignals[1] = uint256(deckRoot);
        pubSignals[2] = uint256(pdata.handRoot);
        pubSignals[3] = uint256(handRoot);
        pubSignals[4] = saltHash;
        pubSignals[5] = randomness;
        pubSignals[6] = pdata.handSize;
        pubSignals[7] = pdata.deckSize - 1;

        if (checkProofs) {
            if (!drawVerifier.verifyProof(proofA, proofB, proofC, pubSignals)) {
                revert Errors.InvalidProof();
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Submit updated hand and deck roots after having drawn a card from the deck.
    function drawCard(
        uint256 gameID,
        bytes32 handRoot,
        bytes32 deckRoot,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external step(gameID, GameStep.DRAW) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        checkDrawProof(
            pdata, handRoot, deckRoot, pdata.saltHash, getPubRandomness(gdata.lastBlockNum), proofA, proofB, proofC
        );

        GameStepLib.drawCard(gameID, gdata, pdata, handRoot, deckRoot);

        // TODO(LATER) if you can't draw you lose the game!
    }

    // ---------------------------------------------------------------------------------------------

    function endTurn(uint256 gameID) external step(gameID, GameStep.END_TURN) {
        // mostly empty: everything happens in the step function
        emit Events.TurnEnded(gameID, msg.sender);
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `card` was contained within `pdata.handRoot` and that `handRoot` is a correctly
    // updated version of `pdata.handRoot`, without `card`, removed using fast array removal.
    function checkPlayProof(
        PlayerData storage pdata,
        bytes32 handRoot,
        uint256 saltHash,
        uint256 cardIndexInHand,
        uint256 cardIndex,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) internal view {
        uint256[6] memory pubSignals;
        pubSignals[0] = uint256(pdata.handRoot);
        pubSignals[1] = uint256(handRoot);
        pubSignals[2] = saltHash;
        pubSignals[3] = cardIndexInHand;
        pubSignals[4] = pdata.handSize - 1; // last index
        pubSignals[5] = cardIndex;

        if (checkProofs) {
            if (!playVerifier.verifyProof(proofA, proofB, proofC, pubSignals)) {
                revert Errors.InvalidProof();
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Play the given card (index into `gameData.cards`).
    function playCard(
        uint256 gameID,
        bytes32 handRoot,
        uint8 cardIndexInHand,
        uint8 cardIndex,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) external step(gameID, GameStep.PLAY) {
        PlayerData storage pdata = gameData[gameID].playerData[msg.sender];
        checkPlayProof(pdata, handRoot, pdata.saltHash, cardIndexInHand, cardIndex, proofA, proofB, proofC);
        GameStepLib.playCard(gameID, gameData, handRoot, cardIndex);
    }

    // ---------------------------------------------------------------------------------------------

    // Declare attackers (indexes into the `cards` array).
    function attack(uint256 gameID, uint8 targetPlayer, uint8[] calldata attacking)
        external
        step(gameID, GameStep.ATTACK)
    {
        GameStepLib.attack(gameID, gameData, targetPlayer, attacking);
    }

    // ---------------------------------------------------------------------------------------------

    // Declare defenders & resolve combat: each creature in `defending` will block the
    // corresponding creature in the attacker's `attacking` array.
    function defend(uint256 gameID, uint8[] calldata defending) external step(gameID, GameStep.DEFEND) {
        GameStepLib.defend(gameID, gameData, inGame, defending, cardsCollection);
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
