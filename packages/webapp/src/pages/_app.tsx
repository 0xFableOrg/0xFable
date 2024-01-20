// =================================================================================================

// Must come first, so that can we can hook global members before they're used by imports.
import "src/setup"
import "src/store/setup"

import { ConnectKitProvider } from "connectkit"
import { NextPage } from "next"
import type { AppType } from "next/app"
import Head from "next/head"
import { useAccount, WagmiConfig } from "wagmi"
import { useState } from "react"
import { ensureLocalAccountIndex, wagmiConfig } from "src/chain"
import jotaiDebug from "src/components/lib/jotaiDebug"
import { GlobalErrorModal } from "src/components/modals/globalErrorModal"
import { useIsHydrated } from "src/hooks/useIsHydrated"
import { useErrorConfig } from "src/store/hooks"

import "src/styles/globals.css"
import { useRouter } from "next/router"
import { ComponentType, useEffect } from "react"

// =================================================================================================

/**
 * Make pages in the app conform to this type.
 * See [@link useIsHydrated] for more info on the meaning of the `isHydrated` prop.
 */
export type FablePage = NextPage<{ isHydrated: boolean }>

// =================================================================================================

const MyApp: AppType = ({ Component, pageProps }) => {

  return (
    <>
      <Head>
        <title>0xFable</title>
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>

      <WagmiConfig config={wagmiConfig}>
        <ConnectKitProvider>
          {jotaiDebug()}
          <ComponentWrapper Component={Component} pageProps={pageProps} />
        </ConnectKitProvider>
      </WagmiConfig>
    </>
  )
}

export default MyApp

// =================================================================================================

/**
 * Wrapper for the main app component. This is necessary because we want to use the Wagmi account
 * and the `useAccount` hook can only be used within a WagmiConfig.
 */
const ComponentWrapper = ({
  Component,
  pageProps
}: {
  Component: ComponentType
  pageProps: any
}) => {
  const { address } = useAccount()
  const isHydrated = useIsHydrated()
  const errorConfig = useErrorConfig()

    // todo @eviterin: i've understood it so that decks are stored on chain. thus, below part is not going to be needed.
    const testCards = [];
    const [decks, setDecks] = useState<Deck[]>([]);
    //
    useEffect(() => {
      // Apply default cursor
      document.body.classList.add('default-cursor');
  
      // Change to hover cursor when over interactive elements
      document.querySelectorAll('.interactive').forEach(element => {
          element.addEventListener('mouseover', () => {
              document.body.classList.add('hover-cursor');
              document.body.classList.remove('default-cursor');
          });
  
          element.addEventListener('mouseout', () => {
              document.body.classList.remove('hover-cursor');
              document.body.classList.add('default-cursor');
          });
      });
  
      // Change to clicked cursor on mousedown, revert on mouseup
      document.addEventListener('mousedown', function(event) {
          if (event.button === 0) {
              document.body.classList.add('clicked-cursor');
              document.body.classList.remove('default-cursor');
              document.body.classList.remove('hover-cursor');
          }
      });
 
      document.addEventListener('mouseup', function(event) {
          if (event.button === 0) {
              document.body.classList.remove('clicked-cursor');
              document.body.classList.add('default-cursor');
          }
      });
    }, []);



  if (process.env.NODE_ENV === "development") { // constant
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter()
    const accountIndex = parseInt(router.query.index as string)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (accountIndex === undefined || isNaN(accountIndex)) return
      if (accountIndex < 0 || 9 < accountIndex) return
      void ensureLocalAccountIndex(accountIndex)
    }, [accountIndex, address])

    // It's necessary to update this on address, as Web3Modal (and possibly other wallet frameworks)
    // will ignore our existence and try to override us with their own account (depending on how
    // async code scheduling ends up working out).

    // To carry the `index` query parameter to other parts of the app, be sure to use the `navigate`
    // function from `utils/navigate.ts` instead of `router.push`.
  }

  return <>
    <Component { ...pageProps } isHydrated={isHydrated} decks={decks} setDecks={setDecks}/>
    {/* Global error modal for errors that don't have obvious in-flow resolutions. */}
    {isHydrated && errorConfig && <GlobalErrorModal config={errorConfig} />}
  </>
}

// =================================================================================================