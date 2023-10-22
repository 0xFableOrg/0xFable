// =================================================================================================

// Must come first, so that can we can hook global members before they're used by imports.
import "src/setup"
import "src/store/setup"

import { ConnectKitProvider } from "connectkit"
import { NextPage } from "next"
import type { AppType } from "next/app"
import Head from "next/head"
import { WagmiConfig } from "wagmi"

import { wagmiConfig } from "src/chain"
import jotaiDebug from "src/components/lib/jotaiDebug"
import { GlobalErrorModal } from "src/components/modals/globalErrorModal"
import { useIsHydrated } from "src/hooks/useIsHydrated"
import { useErrorConfig } from "src/store/hooks"

import "src/styles/globals.css"

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
        <ConnectKitProvider>
          {jotaiDebug()}
          <Component { ...pageProps } isHydrated={isHydrated} />
        </ConnectKitProvider>
      </WagmiConfig>

      {/* Global error modal for errors that don't have obvious in-flow resolutions. */}
      {isHydrated && errorConfig && <GlobalErrorModal config={errorConfig} />}
    </>
  )
}

export default MyApp

// =================================================================================================