import type { AppType } from "next/app"
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider
} from "@web3modal/ethereum"
import { Web3Modal } from "@web3modal/react"
import { configureChains, createClient, WagmiConfig } from "wagmi"
import { localhost } from "wagmi/chains"

import "../styles/globals.css"

// From the WalletConnect cloud
const projectId='8934622f70e11b51de893ea309871a4c'

const chains = [localhost]

const { provider } = configureChains(chains, [w3mProvider({ projectId })])

const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 2, chains }), // todo v2?
  provider,
})

const ethereumClient = new EthereumClient(wagmiClient, chains);

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <Component {...pageProps} />
      </WagmiConfig>

      <Web3Modal
        projectId={process.env.NEXT_PUBLIC_WALLET_CONNECT_ID}
        ethereumClient={ethereumClient}
      />
    </>
  )
}

export default MyApp
