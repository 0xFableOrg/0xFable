// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {CardsCollection, Stats} from "../CardsCollection.sol";
import {GameEventsLib as Events} from "./GameEventsLib.sol";
import {GameErrorsLib as Errors} from "./GameErrorsLib.sol";
import {GameInternalLib} from "./GameInternalLib.sol";
import {GameStep,PlayerData, GameData} from "./GameStructsAndEnums.sol";
import {Constants} from "./Constants.sol";
import {GameUtils as Utils} from "./GameUtils.sol";

library GameStepLib {
    using GameInternalLib for GameData;

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

        emit Events.PlayerDrewHand(gameID, msg.sender);

        if (gdata.playersLeftToJoin == 0 && gdata.players.length == gdata.livePlayers.length) {
            // Start the game! First player chosen randomly.
            gdata.currentPlayer = uint8(randomness % gdata.players.length);
            gdata.currentStep = GameStep.PLAY; // first player doesn't draw
            gdata.lastBlockNum = block.number;
            emit Events.GameStarted(gameID);
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
        emit Events.CardDrawn(gameID, gdata.currentPlayer);
    }

    // ---------------------------------------------------------------------------------------------

    function playCard(
        uint256 gameID,
        mapping(uint256 => GameData) storage gameData,
        bytes32 handRoot,
        uint8 cardIndex
    ) external {
        GameData storage gdata = gameData[gameID];
        PlayerData storage pdata = gdata.playerData[msg.sender];
        if (cardIndex > gdata.cards.length) {
            revert Errors.CardIndexTooHigh();
        }

        pdata.handRoot = handRoot;
        pdata.handSize--;
        pdata.battlefield |= 1 << cardIndex;
        emit Events.CardPlayed(gameID, gdata.currentPlayer, cardIndex);
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
        emit Events.PlayerAttacked(gameID, msg.sender, gdata.players[targetPlayer]);
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
                    gdata.playerDefeated(gameID, inGame, msg.sender);
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
                    emit Events.CreatureDestroyed(gameID, msg.sender, defending[i]);
                }

                if (defenderStats.attack >= attackerStats.defense) {
                    attacker.battlefield -= (1 << attacking[i]);
                    attacker.graveyard |= (1 << attacking[i]);
                    emit Events.CreatureDestroyed(gameID, gdata.attackingPlayer, attacking[i]);
                }
            }
        }

        emit Events.PlayerDefended(gameID, gdata.attackingPlayer, msg.sender);
    }
}