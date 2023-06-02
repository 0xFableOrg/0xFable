import { type TransactionReceipt } from "viem"

import { deployment } from "src/deployment"
import { cardsCollectionABI, deckAirdropABI, gameABI, inventoryABI } from "src/generated"
import { useChainWrite, UseWriteResult } from "src/hooks/useChainWrite"

import { Hash } from "src/chain"

// =================================================================================================
// use<Contract>Write: just `useWrite` with the contract address and ABI already set.

export type UseContractSpecificWriteParams = {
  functionName: string,
  args?: any[],
  onWrite?: () => void,
  onSigned?: (data: { hash: Hash }) => void,
  onSuccess?: (data: TransactionReceipt) => void,
  onError?: (err: Error) => void,
  setLoading?: (string) => void,
  enabled?: boolean
}

// -------------------------------------------------------------------------------------------------

export function useGameWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useChainWrite({...params, contract: deployment.Game, abi: gameABI})
  } catch (e) {
    return { write: null }
  }
}

// -------------------------------------------------------------------------------------------------

export function useCardsCollectionWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useChainWrite({...params, contract: deployment.CardsCollection, abi: cardsCollectionABI})
  } catch (e) {
    return { write: null }
  }
}

// -------------------------------------------------------------------------------------------------

export function useInventoryWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useChainWrite({...params, contract: deployment.Inventory, abi: inventoryABI})
  } catch (e) {
    return { write: null }
  }
}

// -------------------------------------------------------------------------------------------------

export function useDeckAirdropWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useChainWrite({...params, contract: deployment.DeckAirdrop, abi: deckAirdropABI})
  } catch (e) {
    return { write: null }
  }
}
// =================================================================================================