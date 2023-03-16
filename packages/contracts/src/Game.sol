// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./Inventory.sol";
import "./CardsCollection.sol";
import "./DrawVerifier.sol";
import "./PlayVerifier.sol";

import "forge-std/console.sol";

// Data + logic to play a game.
contract Game {

    // =============================================================================================
    // ERRORS

    // The game doesn't exist or has already ended.
    error NoGameNoLife();

    // Trying to take an action when it's not your turn.
    error WrongPlayer();

    // Trying to take a game action that is not allowed right now.
    error WrongStep();

    // Trying to start a game with fewer than 2 people.
    error YoullNeverPlayAlone();

    // Game creators didn't supply the same number of decks than the number of players.
    error WrongNumberOfDecks();

    // Trying to join or decline a game that you already joined.
    error AlreadyJoined();

    // Trying to cancel a game you didn't create.
    error OvereagerCanceller();

    // Trying to cancel or join a game that has already started.
    error GameAlreadyStarted();

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

    // =============================================================================================
    // EVENTS

    // Replace player indexes in all of those by addresses.

    // NOTE(norswap): we represented players as an address when the event can contribute to their
    //  match stats, and as a uint8 index when these are internal game events.

    // The player took to long to submit an action and lost as a consequence.
    event PlayerTimedOut(uint256 indexed gameID, address indexed player);

    // A game was created by the given creator.
    event GameCreated(uint256 gameID, address indexed creator);

    // A player joined the game.
    event PlayerJoined(uint256 indexed gameID, address player);

    // The game started (all players specified at the game creation joined).
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

    uint16 constant STARTING_HEALTH = 20;

    // Marks the absence of index inside an index array.
    uint8 constant NONE = 255;

    // =============================================================================================
    // TYPES

    // Action that can be taken in the game.
    enum GameStep {
        DRAW,
        PLAY,
        ATTACK,
        DEFEND,
        PASS
    }

    // Per-player game data.
    struct PlayerData {
        uint16 health;
        uint8 deckStart;
        uint8 deckEnd;
        bytes32 handRoot;
        bytes32 deckRoot;
        uint256 battlefield;
        uint256 graveyard;
        uint8[] attacking;
    }

    // All the data for a single game instance.
    struct GameData {
        address gameCreator;
        mapping(address => PlayerData) playerData;
        address[] players;
        uint256 lastBlockNum;
        uint8 playersLeftToJoin;
        function (uint256, address, uint8, bytes memory) external returns (bool) joinCheck;
        uint8 currentPlayer;
        GameStep currentStep;
        address attackingPlayer;
        uint256[] cards;
    }

    // A subset of `GameData` members, excluding non-readable members (mapping, function), and
    // the cards array that never changes. Use `getCards()` to read them instead.
    struct StaticGameData {
        address gameCreator;
        address[] players;
        uint256 lastBlockNum;
        uint8 playersLeftToJoin;
        uint8 currentPlayer;
        GameStep currentStep;
        address attackingPlayer;
    }

    // =============================================================================================
    // FIELDS

    // Game IDs are attributed sequentially.
    uint256 nextID;

    // Maps game IDs to game data.
    mapping(uint256 => GameData) public gameData;

    struct Farts {
        uint256 x;
        uint256 y;
    }

    mapping(uint256 => Farts) public gameFarts;

    // The inventory containing the cards that will be used in this game.
    Inventory public inventory;

    // The NFT collection that contains all admissible cards for use  in this game.
    CardsCollection public cardsCollection;

    // Draw card and play card verifiers.
    DrawVerifier public drawVerifier;
    PlayVerifier public playVerifier;

    // =============================================================================================
    // MODIFIERS

    // Check that the game exists (has been created and is not finished).
    modifier exists(uint256 gameID) {
        if (gameData[gameID].lastBlockNum == 0)
            revert NoGameNoLife();
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

        if (gdata.lastBlockNum == 0)
            revert NoGameNoLife();
        if (gdata.players[gdata.currentPlayer] != msg.sender)
            revert WrongPlayer();
        if (block.number > 256 && gdata.lastBlockNum < block.number - 256) {
            // Action timed out: the player loses.
            concedeGame(gameID);
            emit PlayerTimedOut(gameID, msg.sender);
            return;
        }

        // TODO(LATER): This is the max timeout, make shorter + implement a chess clock.

        if (gdata.currentStep == GameStep.PLAY) {
            if (requestedStep != GameStep.PLAY
            && requestedStep != GameStep.ATTACK
                && requestedStep != GameStep.PASS)
                revert WrongStep();
        } else if (gdata.currentStep == GameStep.ATTACK) {
            if (requestedStep != GameStep.ATTACK
                && requestedStep != GameStep.PASS)
                revert WrongStep();
        } else if (gdata.currentStep != requestedStep)
            revert WrongStep();

        _;

        if (requestedStep == GameStep.DRAW) {
            gdata.currentStep = GameStep.PLAY;
        } else if (requestedStep == GameStep.PLAY) {
            gdata.currentStep = GameStep.ATTACK;
        } else if (requestedStep == GameStep.ATTACK) {
            gdata.currentStep = GameStep.DEFEND;
            gdata.currentPlayer = uint8((gdata.currentPlayer + 1) % gdata.players.length);
        } else if (requestedStep == GameStep.DEFEND) {
            gdata.currentStep = GameStep.DRAW; // enum wraparound
        } else if (requestedStep == GameStep.PASS) {
            gdata.currentStep = GameStep.DRAW;
            gdata.currentPlayer = uint8((gdata.currentPlayer + 1) % gdata.players.length);
        }
        gdata.lastBlockNum = block.number;
    }

    // =============================================================================================

    constructor(Inventory inventory_, DrawVerifier drawVerifier_, PlayVerifier playVerifier_) {
        inventory = inventory_;
        cardsCollection = inventory.originalCardsCollection();
        drawVerifier = drawVerifier_;
        playVerifier = playVerifier_;
    }

    // =============================================================================================
    // FUNCTIONS

    // Returns a subset of `GameData` members, excluding non-readable members (mapping, function),
    // and the cards array that never changes. Use `getCards()` to read them instead.
    function staticGameData(uint256 gameID) external view returns(StaticGameData memory) {
        GameData storage gdata = gameData[gameID];
        return StaticGameData({
            gameCreator: gdata.gameCreator,
            players: gdata.players,
            lastBlockNum: gdata.lastBlockNum,
            playersLeftToJoin: gdata.playersLeftToJoin,
            currentPlayer: gdata.currentPlayer,
            currentStep: gdata.currentStep,
            attackingPlayer: gdata.attackingPlayer
        });
    }

    // ---------------------------------------------------------------------------------------------

    function playerData(uint256 gameID, address player) external view returns(PlayerData memory) {
        return gameData[gameID].playerData[player];
    }

    // ---------------------------------------------------------------------------------------------

    // To be used as callback for `createGame`, allow any player to join with any deck.
    function allowAnyPlayerAndDeck(uint256 /*gameID*/, address /*player*/, uint8 /*deckID*/, bytes memory /*data*/)
            external pure returns(bool) {
        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Starts a game for the given number of players (only works for 2 currently) with a function to
    // check if a given player is allowed to join. For testing purposes, you can use the
    // `allowAnyPlayerInDeck` function in this contract. Joining the game must happen on a later
    // block than starting the game.
    function createGame(
        uint8 numberOfPlayers
        // TODO this is very hard to encode in wagmi/ethers
        // , function (uint256, address, uint8, bytes memory) external returns (bool) joinCheck
        ) external returns (uint256 gameID) {

        unchecked { // for gas efficiency lol
            gameID = nextID++;
        }

        if (numberOfPlayers < 2)
            revert YoullNeverPlayAlone();

        GameData storage gdata = gameData[gameID];
        gdata.gameCreator = msg.sender;
        gdata.playersLeftToJoin = numberOfPlayers;
        gdata.lastBlockNum = block.number;
        gdata.currentStep = GameStep.PLAY;

        // TODO
        // gdata.joinCheck = joinCheck;
        gdata.joinCheck = this.allowAnyPlayerAndDeck;

        // `gdata.players` is filled as players join.
        // `gdata.currentPlayer` is initialized when the game is started. This needs to happen in
        // another block so that the blockhash of this block can be used as randomness.

        emit GameCreated(gameID, msg.sender);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the given player's deck listing.
    function playerDeck(uint256 gameID, address player)
            public view exists(gameID) returns(uint256[] memory) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[player];
        uint256[] memory deck = new uint256[](pdata.deckEnd - pdata.deckStart);
        for (uint256 i = 0; i < deck.length; ++i)
            deck[i] = gdata.cards[pdata.deckStart + i];
        return deck;
    }

    // ---------------------------------------------------------------------------------------------

    // Clear (zero) the contents of the array and make it zero-sized.
    function clear(uint8[] storage array) internal {
        for (uint256 i = 0; i < array.length; ++i)
            array.pop();
    }

    // ---------------------------------------------------------------------------------------------

    // Deletes all data related to the game.
    function deleteGame(GameData storage gdata, uint256 gameID) internal {
        // clear cards
        for (uint256 i = 0; i < gdata.cards.length; ++i)
            delete gdata.cards[i];

        // clear players and player data
        for (uint256 i = 0; i < gdata.players.length; ++i) {
            // TODO(LATER) Is all of this necessary beyond clearing the mapping?
            PlayerData storage pdata = gdata.playerData[gdata.players[i]];
            clear(pdata.attacking);
            delete gdata.playerData[gdata.players[i]];
            delete gdata.players[i];
        }
        delete gameData[gameID];
    }

    // ---------------------------------------------------------------------------------------------

    // TODO(LATER): Clear data for games that were created but never started.
    //   - Probably need to map a user to the games they started and enforce some housekeeping.
    //   - Could let anybody do it - it's beneficial because of gas rebates.
    //   - Just track game created but not started per creation block and enforce a timeout.

    // ---------------------------------------------------------------------------------------------

    // Cancel a game you created, before it is started.
    function cancelGame(uint256 gameID) external {
        GameData storage gdata = gameData[gameID];
        if (gdata.gameCreator != msg.sender)
            revert OvereagerCanceller();
        if (gdata.playersLeftToJoin == 0)
            revert GameAlreadyStarted();
        deleteGame(gdata, gameID);
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `pdata.handRoot` is a merkle root of 7 cards drawn from the player's deck
    // according to `randomness`, and that `pdata.deckRoot` contains the initial player's deck
    // cards, minus the cards drawn, in order, but updated using fast array removal
    // (swap removed card with last card, and truncate the array by one).
    //
    // The player's deck is cards[pdata.deckStart:pdata.deckEnd].
    function checkInitialHandProof(PlayerData storage pdata, uint256[] storage cards,
             uint256 randomness, bytes calldata proof) view internal {
        // TODO(PROOF)
    }

    // ---------------------------------------------------------------------------------------------

    // Joins a game that you a player is included in but hasn't joined yet. Calling this function
    // means you agree with the deck listing that was reported by the `createGame` function.
    function joinGame(uint256 gameID, uint8 deckID, bytes calldata data, bytes32 handRoot, bytes32 deckRoot,
            bytes calldata proof) external {

        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        if (pdata.handRoot != 0)
            revert AlreadyJoined();

        if (gdata.playersLeftToJoin == 0)
            revert GameAlreadyStarted();
        if (!gdata.joinCheck(gameID, msg.sender, deckID, data))
            revert NotAllowedToJoin();
        gdata.players.push(msg.sender);

        // Add the player's cards to `gdata.cards`.
        uint256[] storage cards = gdata.cards;
        pdata.deckStart = uint8(cards.length);
        inventory.checkDeck(msg.sender, deckID);
        uint256[] memory deck = inventory.getDeck(msg.sender, deckID);

        for (uint256 i = 0; i < deck.length; i++)
            cards.push(deck[i]);
        pdata.deckEnd = uint8(cards.length);

        pdata.health = STARTING_HEALTH;
        pdata.handRoot = handRoot;
        pdata.deckRoot = deckRoot;

        uint256 randomness = uint256(blockhash(gdata.lastBlockNum));
        checkInitialHandProof(pdata, gdata.cards, randomness, proof);
        emit PlayerJoined(gameID, msg.sender);

        if (--gdata.playersLeftToJoin == 0) {
            // Start the game!
            gdata.currentPlayer = uint8(randomness % gdata.players.length);
            gdata.currentStep = GameStep.PLAY; // first player doesn't draw
            gdata.lastBlockNum = block.number;
            emit GameStarted(gameID);

            // TODO(LATER) let the game creator reorder the players, and choose the first player
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Function to be called after a player's health drops to 0, to check if only one player is
    // left, in which case an event is emitted and the game data is deleted.
    function maybeEndGame(GameData storage gdata, uint256 gameID) internal {
        address winner = address(0);
        for (uint256 i = 0; i < gdata.players.length; ++i) {
            address player = gdata.players[i];
            if (gdata.playerData[player].health > 0) {
                if (winner != address(0)) return;
                winner = player;
            }
        }
        deleteGame(gdata, gameID);
        emit Champion(gameID, winner);
    }

    // ---------------------------------------------------------------------------------------------

    // Let a player concede defeat.
    function concedeGame(uint256 gameID) public exists(gameID) {
        if (gameData[gameID].playerData[msg.sender].handRoot == 0)
            revert PlayerNotInGame();
        GameData storage gdata = gameData[gameID];
        gdata.playerData[msg.sender].health = 0;
        emit PlayerConceded(gameID, msg.sender);
        maybeEndGame(gdata, gameID);
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `handRoot` is a correctly updated version of `pdata.handRoot`, adding a card drawn
    // according to `randomness`, and that `deckRoot` is a correctly updated version of
    // `pdata.deckRoot`, that removes the drawn card from the deck using fast array removal (swap
    // removed card with last card, and truncate the array by one).
    function checkDrawProof(PlayerData storage pdata, bytes32 handRoot, bytes32 deckRoot,
            uint256 randomness, bytes calldata proof) view internal {

        if (address(drawVerifier) == address(0)) return;

        uint256[] memory pubSignals = new uint256[](5);
        pubSignals[0] = uint256(pdata.deckRoot);
        pubSignals[1] = uint256(deckRoot);
        pubSignals[2] = uint256(pdata.handRoot);
        pubSignals[3] = uint256(handRoot);
        pubSignals[4] = randomness;

        drawVerifier.verifyProof(proof, pubSignals);
    }

    // ---------------------------------------------------------------------------------------------

    // Submit updated hand and deck roots after having drawn a card from the deck.
    function drawCard
            (uint256 gameID, bytes32 handRoot, bytes32 deckRoot, bytes calldata proof)
            external step(gameID, GameStep.DRAW) {

        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        uint256 randomness = uint256(blockhash(gdata.lastBlockNum));
        checkDrawProof(pdata, handRoot, deckRoot, randomness, proof);
        pdata.handRoot = handRoot;
        pdata.deckRoot = deckRoot;
        emit CardDrawn(gameID, gdata.currentPlayer);

        // TODO(LATER) if you can't draw you lose the game!
    }

    // ---------------------------------------------------------------------------------------------

    function pass(uint256 gameID) step(gameID, GameStep.PASS) external {
        // empty: everything happens in the step function
    }

    // ---------------------------------------------------------------------------------------------

    // Check that `card` was contained within `pdata.handRoot` and that `handRoot` is a correctly
    // updated version of `pdata.handRoot`, without card, removed using fast array removal.
    function checkPlayProof(PlayerData storage pdata, bytes32 handRoot, uint256 card,
            bytes calldata proof) view internal {

        if (address(playVerifier) == address(0)) return;

        uint256[] memory pubSignals = new uint256[](3);
        pubSignals[0] = uint256(pdata.handRoot);
        pubSignals[1] = uint256(handRoot);
        pubSignals[2] = card;

        playVerifier.verifyProof(proof, pubSignals);
    }

    // ---------------------------------------------------------------------------------------------

    // Play the given card (index into `gameData.cards`).
    function playCard(uint256 gameID, bytes32 handRoot, uint8 cardIndex, bytes calldata proof)
            external step(gameID, GameStep.PLAY) {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        if (cardIndex > gdata.cards.length)
            revert CardIndexTooHigh();
        uint256 card = gdata.cards[cardIndex];
        checkPlayProof(pdata, handRoot, card, proof);
        pdata.handRoot = handRoot;
        pdata.battlefield |= 1 << cardIndex;
        emit CardPlayed(gameID, gdata.currentPlayer, card);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true iff the array contains the items.
    function contains (uint8[] storage array, uint8 item) internal view returns(bool) {
        for (uint256 i = 0; i < array.length; ++i)
            if (array[i] == item) return true;
        return false;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true iff the array contains duplicate elements (in O(n) time). 255 (NONE) is ignored.
    function hasDuplicate(uint8[] calldata array) internal pure returns(bool) {
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
            external step(gameID, GameStep.ATTACK) {

        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        if (gdata.currentPlayer == targetPlayer || targetPlayer > gdata.players.length)
            revert WrongAttackTarget();

        if (hasDuplicate(attacking))
            revert DuplicateAttacker();

        for (uint256 i = 0; i < attacking.length; ++i)
            if ((pdata.battlefield & (1 << attacking[i])) == 0)
                revert AttackerNotOnBattlefield();

        clear(pdata.attacking); // Delete old attacking array.
        pdata.attacking = attacking;
        gdata.attackingPlayer = msg.sender;
        emit PlayerAttacked(gameID, msg.sender, gdata.players[targetPlayer]);
    }

    // ---------------------------------------------------------------------------------------------

    // Declare defenders & resolve combat: each creature in `defending` will block the
    // corresponding creature in the attacker's `attacking` array.
    function defend (uint256 gameID, uint8[] calldata defending)
            external step(gameID, GameStep.DEFEND) {

        GameData storage gdata = gameData[gameID];
        PlayerData storage defender = gdata.playerData[msg.sender];
        PlayerData storage attacker = gdata.playerData[gdata.attackingPlayer];
        uint8[] storage attacking = attacker.attacking;

        if (attacking.length != defending.length)
            revert AttackerDefenderMismatch();

        // TODO make sure duplicate 255 are ignored
        if (hasDuplicate(defending))
            revert DuplicateDefender();

        // iterate over attackers
        for (uint256 i = 0; i < attacking.length; ++i) {
            if (defending[i] == NONE) { // attacker not blocked
                uint256 attackingCard = gdata.cards[attacking[i]];
                uint8 damage = cardsCollection.stats(attackingCard).attack;
                if (defender.health <= damage) {
                    defender.health = 0;
                    maybeEndGame(gdata, gameID);
                    break;
                } else {
                    defender.health -= damage;
                }
            } else { // attacker blocked
                if ((defender.battlefield & (1 << defending[i])) == 0)
                    revert DefenderNotOnBattlefield();
                if (contains(defender.attacking, defending[i]))
                    revert DefenderAttacking(defending[i]);

                Stats memory attackerStats;
                Stats memory defenderStats;
                { // avoid stack too deep
                   uint256 attackingCard = gdata.cards[attacking[i]];
                   uint256 defendingCard = gdata.cards[defending[i]];
                   attackerStats = cardsCollection.stats(attackingCard);
                   defenderStats = cardsCollection.stats(defendingCard);
                }

                if (attackerStats.attack >= defenderStats.defense) {
                    defender.battlefield -= (1 << defending[i]);
                    defender.graveyard   |= (1 << defending[i]);
                    emit CreatureDestroyed(gameID, msg.sender, defending[i]);
                }

                if (defenderStats.attack >= attackerStats.defense) {
                    attacker.battlefield -= (1 << attacking[i]);
                    attacker.graveyard   |= (1 << attacking[i]);
                    emit CreatureDestroyed(gameID, gdata.attackingPlayer, attacking[i]);
                }
            }
        }

        emit PlayerDefended(gameID, gdata.attackingPlayer, msg.sender);
    }

    // ---------------------------------------------------------------------------------------------
}