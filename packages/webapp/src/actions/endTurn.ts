/**
 * An user action responsible for making a player play a card he previously drew, by sending the
 * `playCard` transaction.
 *
 * @module action/playCard
 */

import { defaultErrorHandling } from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { getCurrentPlayerAddress, getGameData, getGameID, getPlayerAddress } from "src/store/read"
import { GameStep } from "src/store/types"
import { checkFresh, freshWrap } from "src/store/checkFresh"

// =================================================================================================

export type EndTurnArgs = {
    gameID: bigint
    playerAddress: Address
    setLoading: (label: string | null) => void
}

// =================================================================================================

/**
 * Ends the player's current turn, by sending the `endTurn` transaction.
 * Returns `true` iff the transaction was successfully sent.
 */
export async function endTurn(args: EndTurnArgs): Promise<boolean> {
    try {
        return await skipTurnImpl(args)
    } catch (err) {
        return defaultErrorHandling("skipTurn", err)
    }
}

// =================================================================================================

export async function skipTurnImpl(args: EndTurnArgs): Promise<boolean> {
    const gameID = getGameID()
    const playerAddress = getPlayerAddress()
    const gameData = getGameData()

    if (gameID !== args.gameID || playerAddress !== args.playerAddress || gameData === null) return false // old/stale call

    if (getCurrentPlayerAddress(gameData) !== playerAddress) return false // old/stale call

    if (![GameStep.PLAY, GameStep.ATTACK].includes(gameData.currentStep)) return false // old/stale call

    checkFresh(
        await freshWrap(
            contractWriteThrowing({
                contract: deployment.Game,
                abi: gameABI,
                functionName: "endTurn",
                args: [gameID],
                setLoading: args.setLoading,
            })
        )
    )

    return true
}

// =================================================================================================
