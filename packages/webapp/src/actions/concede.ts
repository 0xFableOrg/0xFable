import { defaultErrorHandling } from "src/actions/errors"
import { checkFresh, freshWrap } from "src/store/checkFresh"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { gameABI } from "src/generated"

// =================================================================================================

export type ConcedeArgs = {
    gameID: bigint
    playerAddress: Address
    setLoading: (label: string | null) => void
    onSuccess: () => void
}

// -------------------------------------------------------------------------------------------------

/**
 * Concedes the game.
 *
 * Returns `true` iff the player successfully conceded the defenders.
 */
export async function concede(args: ConcedeArgs): Promise<boolean> {
    try {
        return await concedeImpl(args)
    } catch (err) {
        args.setLoading(null)
        return defaultErrorHandling("concede", err)
    }
}

// -------------------------------------------------------------------------------------------------

async function concedeImpl(args: ConcedeArgs): Promise<boolean> {
    checkFresh(
        await freshWrap(
            contractWriteThrowing({
                contract: deployment.Game,
                abi: gameABI,
                functionName: "concedeGame",
                args: [args.gameID],
                setLoading: args.setLoading,
            })
        )
    )

    args.onSuccess()
    return true
}

// =================================================================================================
