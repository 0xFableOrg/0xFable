import * as metamask from "@synthetixio/synpress/commands/metamask"

import { test, expect } from "../fixtures"

// State is shared between tests.
test.describe.configure({ mode: "serial" })

let sharedPage

function _test(...args) {
  // disabled test!
}

test.beforeAll(async ({ page }) => {
  sharedPage = page;
  await sharedPage.goto("http://localhost:3000")
})

test.afterAll(async ({ context }) => {
  await context.close()
})

test("connect wallet using default metamask account (first anvil account)", async () => {
  await expect(sharedPage).toHaveTitle(/0xFable/)
  await sharedPage.getByRole("button", { name: "Connect Wallet" }).click()
  await sharedPage.getByRole("button", { name: "MetaMask" }).click();
  await metamask.acceptAccess()

  await expect(sharedPage.getByRole("button", { name: "0xf3...2266"})).toBeVisible()
  await expect(sharedPage.getByRole("button", { name: "Create Game →" })).toBeVisible()
  await expect(sharedPage.getByRole("button", { name: "Join →" })).toBeVisible()
  await expect(sharedPage.getByRole("button", { name: "Mint Deck →" })).toBeVisible()
  await expect(sharedPage.getByRole("link", { name: "Collection →" })).toBeVisible()
})

test("create then cancel", async () => {
  // two click + metamask to create game
  await expect(sharedPage.getByRole("heading", { name: "Game Created" })).toHaveCount(0)
  await sharedPage.getByRole("button", { name: "Create Game →" }).click()
  await expect(sharedPage.getByRole("heading", { name: "Create Game" })).toBeVisible()
  await sharedPage.getByRole("button", { name: "Create Game", exact: true }).click()
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()

  // wait for on-chain inclusion
  // NOTE: this flickers off too fast to be picked up by the test,
  // not sure whey it's so much faster than when than when done manually
  // await expect(sharedPage.getByRole("heading", { name: "Waiting for on-chain inclusion..." })).toBeVisible()
  await sharedPage.waitForFunction("() => document.querySelector('h3').textContent === 'Game Created'")

  // click + metamask to cancel game
  await expect(sharedPage.getByRole("heading", { name: "Game Created" })).toBeVisible()
  await sharedPage.getByRole("button", { name: "Cancel Game" }).click()
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()

  // wait for on-chain inclusion
  await sharedPage.waitForFunction("() => document.querySelector('h3') === null")

  await expect(sharedPage.getByRole("button", { name: "Create Game", exact: true })).toHaveCount(0)
  await expect(sharedPage.getByRole("heading", { name: "Game Created" })).toHaveCount(0)
})

test("create & join", async () => {
  // two click + metamask to create game
  await sharedPage.getByRole("button", { name: "Create Game →" }).click()
  await expect(sharedPage.getByRole("heading", { name: "Create Game" })).toBeVisible()
  await sharedPage.getByRole("button", { name: "Create Game", exact: true }).click()
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()

  // wait for on-chain inclusion
  // NOTE: this flickers off too fast to be picked up by the test,
  // not sure whey it's so much faster than when than when done manually
  // await expect(sharedPage.getByRole("heading", { name: "Waiting for on-chain inclusion..." })).toBeVisible()
  await sharedPage.waitForFunction("() => document.querySelector('h3').textContent === 'Game Created'")

  // click + metamask to cancel game
  await expect(sharedPage.getByRole("heading", { name: "Game Created" })).toBeVisible()
  await sharedPage.getByRole("button", { name: "Join Game" }).click()
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()

  // wait for on-chain inclusion
  await expect(sharedPage.getByRole("heading", { name: "Waiting for other player..." })).toBeVisible()
})

// TODO
//    It would be great if we could figure out how to have two browser windows using two
//    separately configured Metamask accounts. In the meantime, adding a second account and
//    switching between them seems like the way to go.

test("join from other address", async () => {
  // TODO needed?
  // await metamask.disconnectWalletFromAllDapps();

  // second Anvil account
  await metamask.importAccount("59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

  // TODO test -- we could maybe use metamask.switchasccount too
  await sharedPage.getByRole("button", { name: "Connect Wallet" }).click()
  await sharedPage.getByRole("button", { name: "MetaMask" }).click();
  await metamask.acceptAccess();

  await expect(sharedPage.getByRole("button", { name: "0x70...79C8"})).toBeVisible()
})
