import { providers } from "ethers"

import { deployment } from "src/deployment"
import { cardsCollectionABI, deckAirdropABI, gameABI, inventoryABI } from "src/generated"
import { useWrite, UseWriteResult } from "src/hooks/transact"

// =================================================================================================

// use<Contract>Write: just `useWrite` with the contract address and ABI already set.

export type UseContractSpecificWriteParams = {
  functionName: string,
  args?: any[],
  onSuccess?: (data: providers.TransactionReceipt) => void,
  onError?: (err: Error) => void,
  enabled?: boolean
}

// -------------------------------------------------------------------------------------------------

export function useGameWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useWrite({...params, contract: deployment.Game, abi: gameABI})
  } catch (e) {
    return { write: null }
  }
}

// -------------------------------------------------------------------------------------------------

export function useCardsCollectionWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useWrite({...params, contract: deployment.CardsCollection, abi: cardsCollectionABI})
  } catch (e) {
    return { write: null }
  }
}

// -------------------------------------------------------------------------------------------------

export function useInventoryWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useWrite({...params, contract: deployment.Inventory, abi: inventoryABI})
  } catch (e) {
    return { write: null }
  }
}

// -------------------------------------------------------------------------------------------------

export function useDeckAirdropWrite(params: UseContractSpecificWriteParams): UseWriteResult {
  try {
    return useWrite({...params, contract: deployment.DeckAirdrop, abi: deckAirdropABI})
  } catch (e) {
    return { write: null }
  }
}

// =================================================================================================