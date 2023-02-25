import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ethers } from 'ethers'

import './www/style.css'

// =============================================================================
// Read Project Data

// This is before the configuration stuff because we need the deployment address
// of the Multicall3 contract for the localhost chain.

const deployment = require('../contracts/out/deployment.json')
const abis = require('../contracts/out/abis.json')

// =============================================================================
// Configure Rainbow & Wagmi

import '@rainbow-me/rainbowkit/styles.css'
import {
  ConnectButton,
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme, useConnectModal
} from '@rainbow-me/rainbowkit'
import {
  configureChains,
  createClient,
  WagmiConfig,
  useAccount,
  usePrepareSendTransaction,
  useSendTransaction, useSigner, useContractReads, useContractRead
} from 'wagmi'
import { localhost } from 'wagmi/chains'

(localhost.contracts ??= {}).multicall3 = {
  address: deployment.Multicall3,
  blockCreated: 0  // TODO can we omit this? does it matter?
}

import { publicProvider } from 'wagmi/providers/public'

const { chains, provider } = configureChains(
  [localhost],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Opprobrium',
  chains
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

const localhostProvider = provider({chainId: localhost.id})

// =============================================================================

// TODO instantiate contracts
// const Buildings   = new ethers.Contract(deployment.Buildings, abis.Buildings, localhostProvider)

// =============================================================================

function AppBody() {
  return <div></div>
}

function App() {
  return <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains} theme={darkTheme()}>
      <AppBody />
  </RainbowKitProvider>
  </WagmiConfig>
  </React.StrictMode>
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<App />)
