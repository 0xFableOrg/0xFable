import { type TransactionReceipt } from "viem"

import { Hash } from "src/chain"
import { deployment } from "src/deployment"
import { cardsCollectionABI, deckAirdropABI, gameABI, inventoryABI } from "src/generated"
import { useChainWrite, UseWriteResult } from "src/hooks/useChainWrite"

// =================================================================================================
// use<Contract>Write: just `useWrite` with the contract address and ABI already set.

export type UseContractSpecificWriteParams = {
    functionName: string
    args?: any[]
    onWrite?: () => void
    onSigned?: (data: { hash: Hash }) => void
    onSuccess?: (data: TransactionReceipt) => void
    onError?: (err: Error) => void
    setLoading?: (label: string | null) => void
    enabled?: boolean
}

// -------------------------------------------------------------------------------------------------

export function useGameWrite(params: UseContractSpecificWriteParams): UseWriteResult {
    try {
        return useChainWrite({ ...params, contract: deployment.Game, abi: gameABI })
    } catch (e) {
        return { write: undefined }
    }
}

// -------------------------------------------------------------------------------------------------

export function useCardsCollectionWrite(params: UseContractSpecificWriteParams): UseWriteResult {
    try {
        return useChainWrite({ ...params, contract: deployment.CardsCollection, abi: cardsCollectionABI })
    } catch (e) {
        return { write: undefined }
    }
}

// -------------------------------------------------------------------------------------------------

export function useInventoryWrite(params: UseContractSpecificWriteParams): UseWriteResult {
    try {
        return useChainWrite({ ...params, contract: deployment.Inventory, abi: inventoryABI })
    } catch (e) {
        return { write: undefined }
    }
}

// -------------------------------------------------------------------------------------------------

export function useDeckAirdropWrite(params: UseContractSpecificWriteParams): UseWriteResult {
    try {
        return useChainWrite({ ...params, contract: deployment.DeckAirdrop, abi: deckAirdropABI })
    } catch (e) {
        return { write: undefined }
    }
}
// =================================================================================================
