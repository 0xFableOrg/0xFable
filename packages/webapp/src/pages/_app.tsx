import type { AppType } from "next/app"
import Head from "next/head"
import jotaiDebug from "src/components/lib/jotaiDebug"
import { configureChains, createConfig, WagmiConfig } from "wagmi"
import { EthereumClient, w3mConnectors, w3mProvider} from "@web3modal/ethereum"
import { Web3Modal } from "@web3modal/react"

import { setup } from "src/setup"
import { projectId, chain } from "src/constants"

import "src/styles/globals.css"

// =================================================================================================
// SETUP BLOCKCHAIN INTEROP

const chains = [chain]

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 1, chains }),
  publicClient
})

const ethereumClient = new EthereumClient(wagmiConfig, chains)

// =================================================================================================
// SETUP (global hooks & customization)

setup()

// =================================================================================================

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>0xFable</title>
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>

      <WagmiConfig config={wagmiConfig}>
        {jotaiDebug()}
        <Component {...pageProps} />
      </WagmiConfig>

      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
      />
    </>
  )
}

export default MyApp

// =================================================================================================