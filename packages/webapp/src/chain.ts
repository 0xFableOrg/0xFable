/**
 * This module exports values & logic related to chain interop.
 *
 * @module chain
 */

import { EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum"
import { type Chain, configureChains, createConfig } from "wagmi"
import { localhost } from "wagmi/chains"
import { BurnerConnector } from "src/wagmi/BurnerConnector"

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

/** Arrays containing the connector for using a local browser private key. */
const burnerConnectors = process.env.NODE_ENV === "development" ? [new BurnerConnector()] : []

// -------------------------------------------------------------------------------------------------

/** Wagmi's configuration, to be passed to the React WagmiConfig provider. */
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    ...w3mConnectors({ projectId: walletConnectProjectID, chains }),
    ...burnerConnectors ],
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
  address?: Address
}

// -------------------------------------------------------------------------------------------------

/**
 * Simplification of wagmi's unexported GetNetworkResult.
 */
export type NetworkResult = {
  chain?: Chain
}

// =================================================================================================

/**
 * Ensures we're connected to the Anvil ("test ... junk" mnemonic) account with the given index,
 * disconnecting from another Wagmi connector if necessary.
 */
export async function ensureLocalAccountIndex(index: number) {
  await burnerConnectors[0].ensureConnectedToIndex(index)
}

// =================================================================================================