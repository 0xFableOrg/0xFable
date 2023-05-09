/**
 * Utilities for use with the Ethereum's (& co) JSON-RPC APIs.
 *
 * @module utils/rpc-utils
 */

// =================================================================================================

import { BigNumber, type BigNumberish } from "ethers"

import { Address } from "src/types"
import { Chain } from "wagmi"

// =================================================================================================

/**
 * Parses an Ethers' BigNumberish (union type) into a BigInt.
 * Returns null if the value is null or if it cannot be parsed.
 */
export function parseBigInt(value: BigNumberish): bigint {
  if (value == null) return null
  try {
    return BigNumber.from(value).toBigInt()
  } catch (e) {
    return null
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Simplification of GetAccountResult<TProvider> (not export, because of course) in wagmi.
 */
export type AccountResult = {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  address: Address
}

// -------------------------------------------------------------------------------------------------

/**
 * Simplification of GetNetworkResult (not exported, because of course) in wagmi.
 */
export type NetworkResult = {
  chain?: Chain
}

// =================================================================================================