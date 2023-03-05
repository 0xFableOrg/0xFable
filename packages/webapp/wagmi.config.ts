import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    react(),
    foundry({
      project: "../contracts",
      include: [
        "CardsCollection.sol/**/*.json",
        "Game.sol/**/*.json",
        "Inventory.sol/**/*.json",
        "InventoryCardsCollection.sol/**/*.json",
        "DeckAirdrop.sol/**/*.json"
      ]
    }),
  ],
});
