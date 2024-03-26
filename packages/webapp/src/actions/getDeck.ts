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

export type GetDeckAtArgs = {
    playerAddress: Address
    onSuccess: () => void
    index: number
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

/**
 * Fetches the deck of the given player of a given ID by sending the `getDeck` transaction.
 *
 * Returns `true` iff the transaction is successful.
 */
export async function getDeck(args: GetDeckAtArgs): Promise<any> {
    try {
        return await getDeckImpl(args)
    } catch (err) {
        defaultErrorHandling("getDeck", err)
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

/**
 * Fetches deck count of the given player by sending the `getNumDecks` transaction.
 *
 * Returns `true` iff the transaction is successful.
 */
export async function getDeckNames(args: GetDeckArgs): Promise<any> {
    try {
        return await getDeckNamesImpl(args)
    } catch (err) {
        defaultErrorHandling("getDeckNames", err)
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

async function getDeckImpl(args: GetDeckAtArgs): Promise<any> {
    try {
        const result = await contractWriteThrowing({
            contract: deployment.Inventory,
            abi: inventoryABI,
            functionName: "getDeck",
            args: [args.playerAddress, args.index],
        })

        args.onSuccess()
        return result
    } catch (error) {
        console.error("Error fetching deck:", error)
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

// -------------------------------------------------------------------------------------------------

async function getDeckNamesImpl(args: GetDeckArgs): Promise<any> {
    try {
        const result = await contractWriteThrowing({
            contract: deployment.Inventory,
            abi: inventoryABI,
            functionName: "getDeckNames",
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
