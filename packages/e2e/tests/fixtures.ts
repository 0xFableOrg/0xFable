// Source: https://github.com/drptbl/synpress-examples/blob/master/playwright/shared-state/fixtures.ts
// Changed global to globalThis to avoid warnings.

import { test as base, chromium, type BrowserContext } from "@playwright/test";
import metamask from "@synthetixio/synpress/commands/metamask.js";
import helpers from "@synthetixio/synpress/helpers.js";

const { initialSetup } = metamask;
const { prepareMetamask } = helpers;

export const test = base.extend<{
  context: BrowserContext;
}>({
  context: async ({}, use) => {
    // required for synpress
    globalThis.expect = expect;
    // download metamask
    const metamaskPath = await prepareMetamask(
      process.env.METAMASK_VERSION || "10.25.0"
    );
    // prepare browser args
    const browserArgs = [
      `--disable-extensions-except=${metamaskPath}`,
      `--load-extension=${metamaskPath}`,
      "--remote-debugging-port=9222",
    ];
    if (process.env.CI) {
      browserArgs.push("--disable-gpu");
    }
    if (process.env.HEADLESS_MODE) {
      browserArgs.push("--headless=new");
    }
    // launch browser
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: browserArgs,
    });
    // wait for metamask
    await context.pages()[0].waitForTimeout(3000);
    // setup metamask
    await initialSetup(chromium, {
      secretWordsOrPrivateKey:
        // "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "test test test test test test test test test test test junk",
        // "amused spin first verb garlic pumpkin dish aerobic run smoke subway slogan",
        // "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      network: "localhost",
      password: "Tester@1234",
      enableAdvancedSettings: true,
    });
    await use(context);
    if (!process.env.SERIAL_MODE) {
      await context.close();
    }
  },
});
export const expect = test.expect;

// Anvil account 2 secret key: "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"