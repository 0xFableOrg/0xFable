import {providers} from "ethers"
import {useWrite, UseWriteResult} from "src/hooks/transact"
import {deployment} from "src/deployment"
import {gameABI} from "src/generated"

export type UseGameWriteParams = {
  functionName: string,
  args?: any[],
  onSuccess?: (data: providers.TransactionReceipt) => void,
  onError?: (err: Error) => void,
  enabled?: boolean
}

// Just `useWrite` with the contract address and ABI already set.
export function useGameWrite(params: UseGameWriteParams): UseWriteResult {
  try {
    return useWrite({...params, contract: deployment.Game, abi: gameABI})
  } catch (e) {
    return { write: null }
  }
}