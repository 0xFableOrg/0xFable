import type { Address, Hash } from "src/types"
import {
  useContractEvent,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi"
import { type TransactionReceipt } from "viem"

// =================================================================================================
// useWrite

export type UseWriteParams = {
  contract: Address
  abi: any
  functionName: string
  args?: any[]
  onWrite?: () => void
  onSuccess?: (data: TransactionReceipt) => void
  onSigned?: (data: { hash: Hash }) => void
  onError?: (err: Error) => void
  setLoading?: (string) => void
  enabled?: boolean
}

export type UseWriteResult = {
  write?: () => void
}

export function useWrite(params: UseWriteParams): UseWriteResult {

  // TODO: we're doing significant work here, this should be memoized

  const { contract, abi, functionName, args } = params
  let { onSigned, onWrite, onSuccess, onError, setLoading, enabled } = params
  if (enabled === undefined) enabled = true

  if (setLoading) {
    onWrite = onWrite
      ? () => { setLoading("Waiting for signature..."); params.onWrite() }
      : () => setLoading("Waiting for signature...")
    onSigned = onSigned
      ? data => { setLoading("Waiting for on-chain inclusion..."); params.onSigned(data) }
      : _ => setLoading("Waiting for on-chain inclusion...")
    onSuccess = onSuccess
      ? data => { setLoading(null); params.onSuccess(data) }
      : _ => setLoading(null)
    onError = onError
      ? error => { setLoading(null); params.onError(error) }
      : error => {
        setLoading(null)
        // It would be nice to combine these two, however, interpolating `error` or event
        // `error.stack` into the string doesn't give the nice builtin formatting + clickable links
        // in browsers' consoles.
        console.log(`Error in useWrite (${functionName}):`)
        console.log(error)
      }
  } else {
    if (!onWrite)   onWrite   = () => {}
    if (!onSuccess) onSuccess = _  => {}
    if (!onSigned)  onSigned  = _  => {}
    if (!onError) onError = error => {
      console.log(`Error in useWrite (${functionName}):`)
      console.log(error)
    }
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
  } as any) // the types are correct but wagmi is being capricious

  // Uses the configuration to get a write function which will send the transaction. After `write`
  // is called and the user signs the transaction in the wallet, the `data` will be populated with a
  // transaction hash (the hash is known before the transaction lands on chain).
  const { data, write } = useContractWrite({
    ...config,
    onMutate: onWrite,
    onSuccess: onSigned,
    onError
  })

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
// useRead

export type UseReadParams = {
  contract: `0x${string}`,
  abi: any,
  functionName: string,
  args?: any[],
  onSuccess?: (data: TransactionReceipt) => void,
  onError?: (err: Error) => void,
  enabled?: boolean
}

export type UseReadResult<T> = {
  data: T,
  refetch?: () => void
}

export function useRead<T>(params: UseReadParams): UseReadResult<T> {
  const { contract, abi, functionName, args } = params
  let { onSuccess, onError, enabled } = params
  if (enabled == undefined) enabled = true
  if (!onSuccess) onSuccess = _ => {}
  if (!onError) onError = error => {
    console.log(`Error in useRead (${functionName}):`)
    console.log(error)
  }

  const { data, refetch } = useContractRead({
    address: contract,
    abi,
    functionName,
    args: args || [],
    enabled,
    onError,
    // cacheTime: Infinity,
    // staleTime: Infinity
  }) as any // trust me bro

  return { data, refetch }
}

// =================================================================================================
// useEvents

// NOTE(norswap): There doesn't seem to be any way to unsubscribe from events /facepalm
//   It's not that hard, wagmi has the function, but doesn't bother returning it.

export function useEvents(address, abi, eventNames, listener) {
  for (const eventName of eventNames) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useContractEvent({ address, abi, eventName,
      listener(...args) {
        listener(eventName, ...args)
      }
    })
  }
}

// =================================================================================================