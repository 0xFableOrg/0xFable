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
import { useIsHydrated } from "src/hooks/useIsHydrated"
import { NextPage } from "next"

// =================================================================================================
// SETUP (global hooks & customization)

setup()

// =================================================================================================

/**
 * Make pages in the app conform to this type.
 * See [@link useIsHydrated] for more info on the meaning of the `isHydrated` prop.
 */
export type FablePage = NextPage<{ isHydrated: boolean }>

// =================================================================================================

const MyApp: AppType = ({ Component, pageProps }) => {
  const errorConfig = useErrorConfig()
  const isHydrated = useIsHydrated()

  return (
    <>
      <Head>
        <title>0xFable</title>
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>

      <WagmiConfig config={wagmiConfig}>
        {jotaiDebug()}
        <Component { ...pageProps } isHydrated={isHydrated} />
      </WagmiConfig>

      <Web3Modal
        projectId={walletConnectProjectID}
        ethereumClient={web3ModalEthereumClient}
      />

      {/* Global error modal for errors that don't have obvious in-flow resolutions. */}
      {isHydrated && errorConfig && <GlobalErrorModal config={errorConfig} />}
    </>
  )
}

export default MyApp

// =================================================================================================