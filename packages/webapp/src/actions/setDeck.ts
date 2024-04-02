import { defaultErrorHandling } from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { inventoryABI } from "src/generated"
import { checkFresh, freshWrap } from "src/store/checkFresh"
import { Deck } from "src/store/types"

// =================================================================================================

export type SaveArgs = {
    deck: Deck
    playerAddress: Address
    onSuccess: () => void
}

export type ModifyArgs = {
    deck: Deck
    playerAddress: Address
    index: number
    onSuccess: () => void
}

// -------------------------------------------------------------------------------------------------

/**
 * Saves a deck created by the player by sending the `saveDeck` transaction.
 *
 * Returns `true` iff the transaction is successful.
 */
export async function save(args: SaveArgs): Promise<boolean> {
    try {
        return await saveImpl(args)
    } catch (err) {
        return defaultErrorHandling("save", err)
    }
}

/**
 * Modifies a deck owned by the player by sending the `modifyDeck` transaction.
 *
 * Returns `true` iff the transaction is successful.
 */
export async function modify(args: ModifyArgs): Promise<boolean> {
    try {
        return await modifyImpl(args)
    } catch (err) {
        return defaultErrorHandling("modify", err)
    }
}

// -------------------------------------------------------------------------------------------------

async function saveImpl(args: SaveArgs): Promise<boolean> {
    const cardBigInts = args.deck.cards.map((card) => card.id)

    checkFresh(
        await freshWrap(
            contractWriteThrowing({
                contract: deployment.Inventory,
                abi: inventoryABI,
                functionName: "addDeck",
                args: [args.playerAddress, { name: args.deck.name, cards: cardBigInts }],
            })
        )
    )

    args.onSuccess()
    return true
}

async function modifyImpl(args: ModifyArgs): Promise<boolean> {
    const cardBigInts = args.deck.cards.map((card) => card.id)
    console.log("INDEX: " + args.index)
    checkFresh(
        await freshWrap(
            contractWriteThrowing({
                contract: deployment.Inventory,
                abi: inventoryABI,
                functionName: "replaceDeck",
                args: [args.playerAddress, args.index, { name: args.deck.name, cards: cardBigInts }],
            })
        )
    )

    args.onSuccess()
    return true
}

// =================================================================================================
