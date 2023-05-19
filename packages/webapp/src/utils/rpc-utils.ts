/**
 * Utilities for use with the Ethereum's (& co) JSON-RPC APIs.
 *
 * @module utils/rpc-utils
 */

// =================================================================================================

import { Address } from "src/types"
import { Chain } from "wagmi"

// =================================================================================================

/**
 * Simplification of wagmi's unexported GetAccountResult<TProvider>.
 */
export type AccountResult = {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  address: Address
}

// -------------------------------------------------------------------------------------------------

/**
 * Simplification of wagmi's unexported GetNetworkResult.
 */
export type NetworkResult = {
  chain?: Chain
}

// =================================================================================================