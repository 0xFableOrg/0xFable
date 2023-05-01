import type { AppType } from "next/app"
import Head from "next/head"
import { configureChains, createClient, WagmiConfig } from "wagmi"
import { localhost } from "wagmi/chains"
import { EthereumClient, w3mConnectors, w3mProvider} from "@web3modal/ethereum"
import { Web3Modal } from "@web3modal/react"

import { setup } from "src/setup"

import "src/styles/globals.css"

// =================================================================================================
// SETUP BLOCKCHAIN INTEROP

// From the WalletConnect cloud
const projectId='8934622f70e11b51de893ea309871a4c'

const chains = [localhost]

const { provider } = configureChains(chains, [w3mProvider({ projectId })])

const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 2, chains }), // todo v2?
  provider,
})

const ethereumClient = new EthereumClient(wagmiClient, chains)

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

      <WagmiConfig client={wagmiClient}>
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