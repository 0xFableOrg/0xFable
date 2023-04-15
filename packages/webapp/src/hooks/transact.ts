import {
  useContractEvent,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi"
import { providers } from "ethers"

// =================================================================================================
// useWrite

export type UseWriteParams = {
  contract: `0x${string}`,
  abi: any,
  functionName: string,
  args?: any[],
  onSuccess?: (data: providers.TransactionReceipt) => void,
  onError?: (err: Error) => void,
  enabled?: boolean
}

export type UseWriteResult = {
  write?: () => void
}

export function useWrite(params: UseWriteParams): UseWriteResult {

  const { contract, abi, functionName, args } = params
  let { onSuccess, onError, enabled } = params
  if (enabled == undefined) enabled = true
  if (!onSuccess) onSuccess = _ => {}
  if (!onError) onError = error => {
    console.log(`Error in useWrite (${functionName}):`)
    console.log(error)
  }

  // TODO(norswap): It could be good to include some generic error handling / preprocessing here.
  //   This will require disantangling what can happen when and what to do about it.
  //   cf. https://twitter.com/norswap/status/1640409794409316361

  // Prepare the transaction configuration: this will call the RPC to simulate the call and get
  // the estimated gas cost.
  const { config } = usePrepareContractWrite({
    address: contract,
    abi,
    functionName,
    args: args || [],
    enabled,
    onError
  })

  // TODO what happens when we spread config but it's disabled?

  // Uses the configuration to get a write function which will send the transaction. After `write`
  // is called, the `data` will be populated with a transaction hash (the hash is known before the
  // transaction lands on chain).
  const { data, write } = useContractWrite({...config, onError})

  // `data` reflects the last invocation of `write` with the same configuration.
  //
  // Crucially, this means that if the configuration changes, the `data` for an in-flight `write`
  // will become inaccessible. One should refrain from changing the parameters of `useWrite` until
  // the transaction has landed on-chain. However, the configuration also includes the gas price and
  // the nonce, which can be updated more frequently. I'm not really sure how this is supposed to
  // be safe (seems like a potential race condition where the config is updated before we can get
  // the data from a write), but it seems to work in practice. If not, `onSuccess` and `onError`
  // callbacks could be used to avoid the issue.
  //
  // Because write commits to a certain nonce, `write` should only be called once per render cycle.

  // Waits for the transaction — this will only be enabled if the hash is defined.
  useWaitForTransaction({
    hash: data?.hash,
    onSuccess,
    onError
  })

  return { write }
}

// =================================================================================================

export function useRead(contract, abi, functionName, args, onSuccess = (_) => {}, enabled = true) {
  const { data, refetch } = useContractRead({
    address: contract,
    abi: abi,
    functionName: functionName,
    args: args,
    onSuccess: onSuccess,
    cacheTime: Infinity,
    staleTime: Infinity,
    enabled: enabled
  });
  return {data, refetch}
}

export function useEvents(address, abi, eventNames, listener) {
  for (const eventName of eventNames) {
    useContractEvent({ address, abi, eventName,
      listener(...args) {
        listener(eventName, ...args)
      }
    });
  }
}