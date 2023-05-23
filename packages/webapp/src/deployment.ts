import type { Address } from "wagmi";
import * as deployment_ from "contracts/out/deployment.json" assert { type: "json" }

export interface Deployment {
  CardsCollection: Address
  Inventory: Address
  InventoryCardsCollection: Address
  Game: Address
  DeckAirdrop: Address
  Multicall3: Address
}

// NOTE: This silly default affair happens when running the e2e tests.
// Something something, Next doesn't process things the same as the vanilla Node/TS config ??

export const deployment = deployment_["default"] === undefined
  ? deployment_ as Deployment
  : deployment_["default"] as Deployment