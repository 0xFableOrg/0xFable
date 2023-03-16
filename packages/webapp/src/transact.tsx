import {
  useContractEvent,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction
} from "wagmi";
import {useState} from "react";

export function useTransact(contract, abi, functionName, args, onSuccess = (_) => {}, enabled = true): [boolean, any] {

  const [completed, setCompleted] = useState(false);

  const { config } = usePrepareContractWrite({
    address: contract,
    abi: abi,
    functionName: functionName,
    args: args,
    enabled: enabled
  });

  const { data, write } = useContractWrite(config);

  useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data){
      setCompleted(true);
      onSuccess(data);
    }
  });

  return [completed, write]
}

export function useRead(contract, abi, functionName, args, onSuccess = (_) => {}, enabled = true): any {
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