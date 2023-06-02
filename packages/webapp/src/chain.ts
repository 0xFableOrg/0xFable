/**
 * This module exports values & logic related to chain interop.
 *
 * @module chain
 */

import { type Chain, configureChains, createConfig } from "wagmi"
import { localhost } from "wagmi/chains"
import { EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum"

// =================================================================================================

/** The list of chains supported by the app. */
export const chains = [localhost]

// =================================================================================================
// Wagmi + WalletConnect Config

// -------------------------------------------------------------------------------------------------

/** WalletConnect cloud project ID. */
export const walletConnectProjectID='8934622f70e11b51de893ea309871a4c'

// -------------------------------------------------------------------------------------------------

/**
 * The wagmi public client, used to read from the blockchain. This can be accessed via wagmi's
 * `getPublicClient` action.
 */
const { publicClient: wagmiPublicClient } =
  configureChains(chains, [w3mProvider({ projectId: walletConnectProjectID })])

// -------------------------------------------------------------------------------------------------

/** Wagmi's configuration, to be passed to the React WagmiConfig provider. */
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId: walletConnectProjectID, version: 1, chains }),
  publicClient: wagmiPublicClient
})

// -------------------------------------------------------------------------------------------------

/** This encapsulate wagmi's functionality for use by Web3Modal. */
export const web3ModalEthereumClient = new EthereumClient(wagmiConfig, chains)

// =================================================================================================
// TYPES

// -------------------------------------------------------------------------------------------------

/** Type of EVM account addresses. */
export type Address = `0x${string}`

// -------------------------------------------------------------------------------------------------

/** Type of 32-byte hashes. */
export type Hash = `0x${string}`

// -------------------------------------------------------------------------------------------------

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