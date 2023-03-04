import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    react(),
    foundry({
      project: "../contracts",
      exclude: [
        "test.sol",
        "IERC721.sol",
        "IERC721Receiver.sol",
        "IERC721Metadata.sol",
        "IERC165.sol",
        "ERC165.sol",
      ],
    }),
  ],
});
