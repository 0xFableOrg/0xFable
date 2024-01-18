// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {CardsCollection, Stats} from "../CardsCollection.sol";
import {Errors} from "./Errors.sol";
import {GameStep, PlayerData, GameData} from "./Structs.sol";
import {Constants} from "./Constants.sol";
import {Utils} from "./Utils.sol";

library GameAction {

    // =============================================================================================
    // EVENTS

    // cf. EVENTS section in Game.sol

    // The player conceded the game.
    event PlayerConceded(uint256 indexed gameID, address indexed player);

    // Not all players joined and drew their hands within the time limit, the game is cancelled
    // as a consequence.
    event MissingPlayers(uint256 indexed gameID);

    // The player took to long to submit an action and lost as a consequence.
    event PlayerTimedOut(uint256 indexed gameID, address indexed player);

    // A player drew his initial hand.
    event PlayerDrewHand(uint256 indexed gameID, address player);

    // The game started (all players joined + drew their initial hands).
    event GameStarted(uint256 indexed gameID);

    // A player drew a card.
    event CardDrawn(uint256 indexed gameID, uint8 player);

    // A player played a card.
    event CardPlayed(uint256 indexed gameID, uint8 player, uint256 card);

    // A player attacked another player.
    event PlayerAttacked(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A creature was destroyed at the given index in the attacker/defender's battlefield.
    // The battlefield index matches the battlefield before the battle (defender defending),
    // which will not match the on-chain battlefield after the battle (because the destroyed
    // creatures are removed).
    event CreatureDestroyed(uint256 indexed gameID, address player, uint8 cardIndex);

    // A player defended against another player.
    event PlayerDefended(uint256 indexed gameID, address attackingPlayer, address defendingPlayer);

    // A player was defeated by an ennemy attack.
    event PlayerDefeated(uint256 indexed gameID, address indexed player);

    // Someone won!
    event Champion(uint256 indexed gameID, address indexed player);

    // ---------------------------------------------------------------------------------------------

    function concedeGame(
        uint256 gameID,
        mapping(uint256 => GameData) storage gameData,
        mapping(address => uint256) storage inGame
    ) public {
        GameData storage gdata = gameData[gameID];
        if (gdata.playerData[msg.sender].handRoot == 0) {
            revert Errors.PlayerNotInGame();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            revert Errors.FalseStart();
        }
        emit PlayerConceded(gameID, msg.sender);
        playerDefeated(gdata, gameID, inGame, msg.sender);
        gdata.lastBlockNum = block.number;
    }

    // ---------------------------------------------------------------------------------------------

    function timeout(
        uint256 gameID,
        mapping(uint256 => GameData) storage gameData,
        mapping(address => uint256) storage inGame
    ) external {
        GameData storage gdata = gameData[gameID];
        if (gdata.lastBlockNum > block.number - 256) {
            revert Errors.GameNotTimedOut();
        }
        if (gdata.currentStep == GameStep.ENDED) {
            revert Errors.GameAlreadyEnded();
        }
        if (gdata.currentStep == GameStep.UNINITIALIZED) {
            emit MissingPlayers(gameID);
            endGameBeforeStart(gameID, gdata, inGame);
        } else {
            address timedOutPlayer = gdata.players[gdata.currentPlayer];
            emit PlayerTimedOut(gameID, timedOutPlayer);
            playerDefeated(gdata, gameID, inGame, timedOutPlayer);
            gdata.lastBlockNum = block.number;
        }
    }

    // ---------------------------------------------------------------------------------------------

    function drawInitialHand(
        uint256 gameID,
        GameData storage gdata,
        PlayerData storage pdata,
        bytes32 handRoot,
        bytes32 deckRoot,
        uint256 randomness
    ) external {
        if (pdata.joinBlockNum == 0) {
            revert Errors.PlayerNotInGame();
        }
        if (pdata.handRoot != 0) {
            revert Errors.AlreadyDrew();
        }

        pdata.handRoot = handRoot;
        pdata.deckRoot = deckRoot;
        pdata.handSize = Constants.INITIAL_HAND_SIZE;

        uint256 deckStart = pdata.deckStart;
        uint256 deckEnd = pdata.deckEnd;
        pdata.deckSize = uint8(deckEnd - deckStart - Constants.INITIAL_HAND_SIZE);

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

        if (gdata.playersLeftToJoin == 0 && gdata.players.length == gdata.livePlayers.length) {
            // Start the game! First player chosen randomly.
            gdata.currentPlayer = uint8(randomness % gdata.players.length);
            gdata.currentStep = GameStep.PLAY; // first player doesn't draw
            gdata.lastBlockNum = block.number;
            emit GameStarted(gameID);
        }
    }

    // ---------------------------------------------------------------------------------------------

    function drawCard(
        uint256 gameID,
        GameData storage gdata,
        PlayerData storage pdata,
        bytes32 handRoot,
        bytes32 deckRoot
    ) external {
        pdata.handRoot = handRoot;
        pdata.deckRoot = deckRoot;
        pdata.handSize++;
        pdata.deckSize--;
        emit CardDrawn(gameID, gdata.currentPlayer);
    }

    // ---------------------------------------------------------------------------------------------

    function playCard(uint256 gameID, mapping(uint256 => GameData) storage gameData, bytes32 handRoot, uint8 cardIndex)
        external
    {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        if (cardIndex > gdata.cards.length) {
            revert Errors.CardIndexTooHigh();
        }

        pdata.handRoot = handRoot;
        pdata.handSize--;
        pdata.battlefield |= 1 << cardIndex;
        emit CardPlayed(gameID, gdata.currentPlayer, cardIndex);
    }

    // ---------------------------------------------------------------------------------------------

    function attack(
        uint256 gameID,
        mapping(uint256 => GameData) storage gameData,
        uint8 targetPlayer,
        uint8[] calldata attacking
    ) external {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];

        // NOTE: This allows attacking dead player in (unsupported) games with > 2 players.
        if (gdata.currentPlayer == targetPlayer || targetPlayer > gdata.players.length) {
            revert Errors.WrongAttackTarget();
        }

        if (Utils.hasDuplicate(attacking)) {
            revert Errors.DuplicateAttacker();
        }

        for (uint256 i = 0; i < attacking.length; ++i) {
            if ((pdata.battlefield & (1 << attacking[i])) == 0) {
                revert Errors.AttackerNotOnBattlefield();
            }
        }

        Utils.clear(pdata.attacking); // Delete old attacking array.
        pdata.attacking = attacking;
        gdata.attackingPlayer = msg.sender;
        emit PlayerAttacked(gameID, msg.sender, gdata.players[targetPlayer]);
    }

    // ---------------------------------------------------------------------------------------------

    function defend(
        uint256 gameID,
        mapping(uint256 => GameData) storage gameData,
        mapping(address => uint256) storage inGame,
        uint8[] calldata defending,
        CardsCollection cardsCollection
    ) external {
        GameData storage gdata = gameData[gameID];
        PlayerData storage defender = gdata.playerData[msg.sender];
        PlayerData storage attacker = gdata.playerData[gdata.attackingPlayer];
        uint8[] storage attacking = attacker.attacking;

        if (attacking.length != defending.length) {
            revert Errors.AttackerDefenderMismatch();
        }

        // TODO make sure duplicate 255 are ignored
        if (Utils.hasDuplicate(defending)) {
            revert Errors.DuplicateDefender();
        }

        // iterate over attackers
        for (uint256 i = 0; i < attacking.length; ++i) {
            if (defending[i] == Constants.NONE) {
                // attacker not blocked
                uint256 attackingCard = gdata.cards[attacking[i]];
                uint8 damage = cardsCollection.stats(attackingCard).attack;
                if (defender.health <= damage) {
                    defender.health = 0;
                    playerDefeated(gdata, gameID, inGame, msg.sender);
                    break;
                } else {
                    defender.health -= damage;
                }
            } else {
                // attacker blocked
                if ((defender.battlefield & (1 << defending[i])) == 0) {
                    revert Errors.DefenderNotOnBattlefield();
                }
                if (Utils.contains(defender.attacking, defending[i])) {
                    revert Errors.DefenderAttacking(defending[i]);
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

    function playerDefeated(
        GameData storage gdata,
        uint256 gameID,
        mapping(address => uint256) storage inGame,
        address player
    ) internal {
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
        maybeEndGame(gdata, gameID, inGame);
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
        revert Errors.ImplementationError();
    }

    // ---------------------------------------------------------------------------------------------

    // Function to be called after a player's health drops to 0, to check if only one player is
    // left, in which case an event is emitted and the game data is deleted.
    function maybeEndGame(GameData storage gdata, uint256 gameID, mapping(address => uint256) storage inGame)
        internal
    {
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
            Utils.clear(pdata.attacking);
            delete gdata.playerData[gdata.players[i]];

            // NOTE: See note below.
            // delete gdata.players[i];
        }

        // NOTE: Keeping the static game data makes it easier for the client to handle the end
        // of the game gracefully, for now.
        // delete gameData[gameID];
    }

    // ---------------------------------------------------------------------------------------------

    function endGameBeforeStart(uint256 gameID, GameData storage gdata, mapping(address => uint256) storage inGame)
        internal
    {
        deleteGame(gdata, gameID);
        for (uint256 i = 0; i < gdata.players.length; ++i) {
            delete inGame[gdata.players[i]];
        }
        gdata.lastBlockNum = block.number;
        gdata.currentStep = GameStep.ENDED;
    }

    // ---------------------------------------------------------------------------------------------
}