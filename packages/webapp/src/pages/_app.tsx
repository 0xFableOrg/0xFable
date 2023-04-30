import { BigNumber } from "ethers"
import type { AppType } from "next/app"
import Head from "next/head"
import { configureChains, createClient, WagmiConfig } from "wagmi"
import { localhost } from "wagmi/chains"
import { EthereumClient, w3mConnectors, w3mProvider} from "@web3modal/ethereum"
import { Web3Modal } from "@web3modal/react"

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

const ethereumClient = new EthereumClient(wagmiClient, chains)

// NOTE(norswap): I am suspecting Web3Modal causes the following error/warnings:
// - "Unsuccessful attempt at preloading some images" (for sure)
// - "SingleFile is hooking the IntersectionObserver API to detect and load deferred images."

const MyApp: AppType = ({ Component, pageProps }) => {

  const oldError = console.error
  console.error = (err) => {
    const code = err?.code
    // Suppress force-printed error that we can handle in error handlers.
    if (code === "UNPREDICTABLE_GAS_LIMIT") {
      window["suppressedErrors"] ||= []
      window["suppressedErrors"].push(err)
    } else {
      oldError(err)
    }
  }

  const oldWarn = console.warn
  console.warn = (warning) => {
    if (typeof warning === "string" &&
         // I KNOW !!!
      (  warning.startsWith("Lit is in dev mode.")
         // WalletConnect U suck
      || warning.startsWith("SingleFile is hooking the IntersectionObserver API to detect and load deferred images")
      )) {
      window["suppressedWarnings"] ||= []
      window["suppressedWarnings"].push(warning)
    } else {
      oldWarn(warning)
    }
  }

  const oldInfo = console.info
  console.info = (info) => {
    // WalletConnect U suck
    if (typeof info === "string" && info.startsWith("Unsuccessful attempt at preloading some images")) {
      window["suppressedInfos"] ||= []
      window["suppressedInfos"].push(info)
    } else {
      oldInfo(info)
    }
  }

  if (BigInt.prototype["toJSON"] == undefined) {
    BigInt.prototype["toJSON"] = function() { return this.toString() }
  }

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
