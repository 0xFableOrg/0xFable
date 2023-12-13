/**
 * This module exports values & logic related to chain interop.
 *
 * @module chain
 */

import { getDefaultConfig, getDefaultConnectors } from "connectkit"
import { type Chain, createConfig } from "wagmi"
import { localhost } from "wagmi/chains"

import { BurnerConnector } from "src/wagmi/BurnerConnector"

// =================================================================================================

/** The list of chains supported by the app. */
export const chains = [localhost]

// =================================================================================================
// Wagmi + ConnectKit Config

// -------------------------------------------------------------------------------------------------

/** WalletConnect cloud project ID. */
export const walletConnectProjectId = "8934622f70e11b51de893ea309871a4c"

// -------------------------------------------------------------------------------------------------

/** Arrays containing the connector for using a local browser private key. */
const burnerConnectors = process.env.NODE_ENV === "development" ? [new BurnerConnector()] : []

// -------------------------------------------------------------------------------------------------

const metadata = {
  name: "0xFable",
  description: "Wizards & shit",
  // url: "https://0xFable.org",
  // icon: "https://0xFable.org/favicon.png",
}

const metaConfig = {
  walletConnectProjectId,
  chains,
  appName: metadata.name,
  appDescription: metadata.description,
  // appUrl: metadata.url,
  // appIcon: metadata.icon,
  app: metadata
}

/** Wagmi's configuration, to be passed to the React WagmiConfig provider. */
export const wagmiConfig = createConfig(
  getDefaultConfig({
    ...metaConfig,
    // In dev, we probably want to use the ?index=X parameters, and autoconnect causes
    // race conditions, leading to connecting via the parameter, disconnecting via autoconnect,
    // then reconnecting via the parameter.
    autoConnect: process.env.NODE_ENV !== "development",
    connectors: [
      ...getDefaultConnectors(metaConfig),
      ...burnerConnectors],
}))

// =================================================================================================
// TYPES

// -------------------------------------------------------------------------------------------------

/** Type of EVM account addresses. */
export type Address = `0x${string}`

// -------------------------------------------------------------------------------------------------

/** Type of 32-byte hashes. */
export type Hash = `0x${string}`

// -------------------------------------------------------------------------------------------------

/** Hash with value 0x0...0 */
export const ZeroHash: Hash = `0x${"0".repeat(64)}`

// -------------------------------------------------------------------------------------------------

/** `0x{string}` */
export type HexString = `0x${string}`

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