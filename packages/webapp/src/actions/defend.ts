import { defaultErrorHandling } from "src/actions/errors"
import { checkFresh, freshWrap } from "src/store/checkFresh"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { gameABI } from "src/generated"

// =================================================================================================

export type DefendArgs = {
  gameID: bigint
  playerAddress: Address
  setLoading: (label: string | null) => void
  /**
   * A list of defending creatures indexes. This array must be the same length as the list of
   * attacking creatures, and maybe contain 0 to signal that an attacking creature should not be
   * blocked.
   */
  defendingCreaturesIndexes: number[]
}

// -------------------------------------------------------------------------------------------------

/**
 * Declares defenders and resolve combat, by sending the `defend` transaction.
 *
 * Returns `true` iff the player successfully declared the defenders.
 */
export async function defend(args: DefendArgs): Promise<boolean> {
  try {
    return await defendImpl(args)
  } catch (err) {
    args.setLoading(null)
    return defaultErrorHandling("defend", err)
  }
}

// -------------------------------------------------------------------------------------------------

async function defendImpl(args: DefendArgs): Promise<boolean> {

  checkFresh(await freshWrap(
    contractWriteThrowing({
      contract: deployment.Game,
      abi: gameABI,
      functionName: "defend",
      args: [
        args.gameID,
        args.defendingCreaturesIndexes
      ],
      setLoading: args.setLoading
    })))

  return true
}

// =================================================================================================