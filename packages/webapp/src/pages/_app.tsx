import type { AppType } from "next/app";
import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { localhost } from "wagmi/chains";

import "../styles/globals.css";

const chains = [localhost];

// Wagmi client
const { provider } = configureChains(chains, [
  walletConnectProvider({
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
  }),
]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
    version: "1", // or "2"
    appName: "0xFable",
    chains,
  }),
  provider,
});

// Web3Modal Ethereum Client
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
  );
};

export default MyApp;
