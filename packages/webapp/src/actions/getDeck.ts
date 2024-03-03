import { defaultErrorHandling } from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { inventoryABI } from "src/generated"

// =================================================================================================

export type GetDeckArgs = {
  playerAddress: Address
  onSuccess: () => void
}

// -------------------------------------------------------------------------------------------------

/**
 * Fetches all decks of the given player by sending the `getAllDecks` transaction.
 *
 * Returns `true` iff the transaction is successful.
 */
export async function getAllDecks(args: GetDeckArgs): Promise<any> {
  try {
    return await getAllDecksImpl(args)
  } catch (err) {
    defaultErrorHandling("getAllDecks", err)
    return false
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Fetches deck count of the given player by sending the `getNumDecks` transaction.
 *
 * Returns `true` iff the transaction is successful.
 */
export async function getNumDecks(args: GetDeckArgs): Promise<any> {
  try {
    return await getNumDecksImpl(args)
  } catch (err) {
    defaultErrorHandling("getNumDecks", err)
    return false
  }
}

// -------------------------------------------------------------------------------------------------

async function getAllDecksImpl(args: GetDeckArgs): Promise<any> {
    try {
      const result = await contractWriteThrowing({
        contract: deployment.Inventory,
        abi: inventoryABI,
        functionName: "getAllDecks",
        args: [args.playerAddress],
      }) 

      args.onSuccess() 
      return result 
    } catch (error) {
      console.error("Error fetching decks:", error)
      return null
    }
  }

// -------------------------------------------------------------------------------------------------

async function getNumDecksImpl(args: GetDeckArgs): Promise<any> {
  try {
    const result = await contractWriteThrowing({
      contract: deployment.Inventory,
      abi: inventoryABI,
      functionName: "getNumDecks",
      args: [args.playerAddress],
    }) 

    args.onSuccess() 
    return result 
  } catch (error) {
    console.error("Error fetching decks:", error)
    return null
  }
}

// =================================================================================================