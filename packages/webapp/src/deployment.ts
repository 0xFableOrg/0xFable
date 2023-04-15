import type { Address } from "wagmi";
import * as deployment_ from "contracts/out/deployment.json";

export interface Deployment {
  CardsCollection: Address
  Inventory: Address
  InventoryCardsCollection: Address
  Game: Address
  DeckAirdrop: Address
  Multicall3: Address
}

export const deployment = deployment_ as Deployment