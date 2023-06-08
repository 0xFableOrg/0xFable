import React from 'react'
import ReactDOM from 'react-dom/client'
import { router } from './router'
import { RouterProvider } from 'react-router-dom'
import jotaiDebug from "src/components/lib/jotaiDebug"
import { WagmiConfig } from "wagmi"
import { Web3Modal } from "@web3modal/react"

import { setup } from "src/setup"
import { walletConnectProjectID, wagmiConfig, web3ModalEthereumClient } from "src/chain"

import "src/styles/globals.css"

// =================================================================================================
// SETUP (global hooks & customization)

setup()

// =================================================================================================

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>

        <WagmiConfig config={wagmiConfig}>
            {jotaiDebug()}
            <RouterProvider router={router} />
        </WagmiConfig>

        <Web3Modal
            projectId={walletConnectProjectID}
            ethereumClient={web3ModalEthereumClient}
        />

    </React.StrictMode>,
)
