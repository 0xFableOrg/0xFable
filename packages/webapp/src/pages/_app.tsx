import type { AppType } from "next/app"
import Head from "next/head"
import jotaiDebug from "src/components/lib/jotaiDebug"
import { WagmiConfig } from "wagmi"
import { Web3Modal } from "@web3modal/react"

import { walletConnectProjectID, wagmiConfig, web3ModalEthereumClient} from "src/chain"
import { GlobalErrorModal } from "src/components/modals/globalErrorModal"
import { useErrorConfig } from "src/store/hooks"
import { setup } from "src/setup"

import "src/styles/globals.css"

// =================================================================================================
// SETUP (global hooks & customization)

setup()

// =================================================================================================

const MyApp: AppType = ({ Component, pageProps }) => {
  const errorConfig = useErrorConfig()
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

      {errorConfig && <GlobalErrorModal config={errorConfig} />}
    </>
  )
}

export default MyApp

// =================================================================================================