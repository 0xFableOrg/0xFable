import { Address } from "wagmi";

export const deployment: Deployment = require("contracts/out/deployment.json");

export interface Deployment {
  CardsCollection: Address;
  Inventory: Address;
  InventoryCardsCollection: Address;
  Game: Address;
  DeckAirdrop: Address;
  Multicall3: Address;
}

