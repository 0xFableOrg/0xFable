import { defaultErrorHandling } from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { gameABI } from "src/generated"
import { checkFresh, freshWrap } from "src/store/checkFresh"
import { getOpponentIndex } from "src/store/read"

// =================================================================================================

export type AttackArgs = {
  gameID: bigint
  playerAddress: Address
  setLoading: (label: string | null) => void
  /**
   * A list of attacking creatures indexes.
   */
  selectedCreaturesIndexes: number[]
}

// -------------------------------------------------------------------------------------------------

/**
 * Declares an attack with the creatures selected by the player, by sending the `attack`
 * transaction.
 *
 * Returns `true` iff the player successfully declared the attack.
 */
export async function attack(args: AttackArgs): Promise<boolean> {
  try {
    return await attackImpl(args)
  } catch (err) {
    args.setLoading(null)
    return defaultErrorHandling("attack", err)
  }
}

// -------------------------------------------------------------------------------------------------

async function attackImpl(args: AttackArgs): Promise<boolean> {

  checkFresh(await freshWrap(
    contractWriteThrowing({
      contract: deployment.Game,
      abi: gameABI,
      functionName: "attack",
      args: [
        args.gameID,
        getOpponentIndex()!,
        args.selectedCreaturesIndexes
      ],
      setLoading: args.setLoading
    })))

  return true
}

// =================================================================================================