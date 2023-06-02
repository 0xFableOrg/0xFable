import type { AppType } from "next/app"
import Head from "next/head"
import jotaiDebug from "src/components/lib/jotaiDebug"
import { WagmiConfig } from "wagmi"
import { Web3Modal } from "@web3modal/react"

import { setup } from "src/setup"
import { walletConnectProjectID, wagmiConfig, web3ModalEthereumClient} from "src/chain"

import "src/styles/globals.css"

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
        projectId={walletConnectProjectID}
        ethereumClient={web3ModalEthereumClient}
      />
    </>
  )
}

export default MyApp

// =================================================================================================