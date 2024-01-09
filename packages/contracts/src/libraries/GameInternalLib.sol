// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {Events} from "./Events.sol";
import {Errors} from "./Errors.sol";
import {GameStep, PlayerData, GameData} from "./Structs.sol";
import {Utils} from "./Utils.sol";

library GameInternalLib {

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
            emit Events.PlayerDefeated(gameID, player);
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
    function maybeEndGame(
        GameData storage gdata, 
        uint256 gameID,
        mapping(address => uint256) storage inGame
    ) internal {
        // TODO
        //   In the future, consider the possibility of a draw if an effect were to reduce
        //   the health of all remaining players to 0 at the same time.
        if (gdata.livePlayers.length == 1) {
            address winner = gdata.players[gdata.livePlayers[0]];
            delete inGame[winner];
            deleteGame(gdata, gameID);
            gdata.currentStep = GameStep.ENDED;
            emit Events.Champion(gameID, winner);
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
}