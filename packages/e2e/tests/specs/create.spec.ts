import metamask from "@synthetixio/synpress/commands/metamask.js"

import { test, expect } from "../fixtures"
import { getGameID, setupGame } from "../chain"

// State is shared between tests.
test.describe.configure({ mode: "serial" })

let sharedPage

const definedTests = []

const PROOF_TIME = 25000

function Test(name, test) {
  definedTests.push({ name, test })
}

test.beforeAll(async ({ page }) => {
  sharedPage = page;
  await sharedPage.goto("http://localhost:3000")
})

test.afterAll(async ({ context }) => {
  await context.close()
})

async function connectMetamask() {
  await sharedPage.getByRole("button", { name: "Connect Wallet" }).click()
  await sharedPage.getByRole("button", { name: "MetaMask" }).click();
  await metamask.acceptAccess()
}

async function switchToAccount(num: number) {
  await metamask.disconnectWalletFromDapp()
  await metamask.switchAccount(num)
  await connectMetamask()
}

Test("connect wallet using default metamask account (first anvil account)", async () => {
  await expect(sharedPage).toHaveTitle(/0xFable/)
  await connectMetamask()

  await expect(sharedPage.getByRole("button", { name: "0xf3...2266"})).toBeVisible()
  await expect(sharedPage.getByRole("button", { name: "Create Game →" })).toBeVisible()
  await expect(sharedPage.getByRole("button", { name: "Join →" })).toBeVisible()
  await expect(sharedPage.getByRole("button", { name: "Mint Deck →" })).toBeVisible()
  await expect(sharedPage.getByRole("link", { name: "Collection →" })).toBeVisible()
})

Test("create then cancel", async () => {
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

Test("create & join", async () => {
  test.setTimeout(30000 + PROOF_TIME)

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

  // click + metamask to join game
  await expect(sharedPage.getByRole("heading", { name: "Game Created" })).toBeVisible()
  await sharedPage.getByRole("button", { name: "Join Game" }).click()
  // joinGame transaction
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()
  // drawInitialhand transaction
  // NOTE: I have observed this to flake once
  await expect(sharedPage.getByRole("heading", { name: "Generating draw proof — may take a minute ..." })).toBeVisible()
  await sharedPage.waitForTimeout(PROOF_TIME) // give time for proof generation
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()

  // wait for on-chain inclusion
  await expect(sharedPage.getByRole("heading", { name: "Waiting for other player..." })).toBeVisible()
})

// NOTE
//    It's currently not possible to have two browser windows using two separately configured
//    Metamask accounts. In the meantime, adding a second account and switching between them is
//    the way to go.

Test("connect from other address", async () => {
  // Normally `switchToAccount` will do this, but somehow the createAccount throws a wrench in the
  // works (I suspect you can't disconnect if you switched to an account you're not connected with).
  await metamask.disconnectWalletFromDapp()
  await metamask.createAccount()
  await switchToAccount(2)
  await expect(sharedPage.getByRole("button", { name: "0x70...79C8"})).toBeVisible()
})

Test("join from other address", async () => {
  test.setTimeout(30000 + PROOF_TIME)

  await sharedPage.getByRole('button', { name: 'Join →' }).click()
  await sharedPage.getByPlaceholder('Game ID').click()
  const gameID = await getGameID()
  await sharedPage.getByPlaceholder('Game ID').fill(Number(gameID).toString())
  await sharedPage.getByRole('button', { name: 'Join Game' }).click()
  // joinGame transaction
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()
  // drawInitialhand transaction
  await expect(sharedPage.getByRole("heading", { name: "Generating draw proof — may take a minute ..." })).toBeVisible()
  await sharedPage.waitForTimeout(PROOF_TIME) // give time for proof generation
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()
  await expect(sharedPage.getByRole('button', { name: 'CONCEDE' })).toBeEnabled()
})

Test("make sure first player is in the game too", async () => {
  // NOTE: Currently we stay on the play page after disconnecting Metamask. Is that what we want or
  // do we want to go back to the menu? In any case, the buttons are named the same, so the call
  // here still works.
  await switchToAccount(1)
  // Enabled, not visible, meaning we connected to a player that is recognized as being in the game!
  await expect(sharedPage.getByRole('button', { name: 'CONCEDE' })).toBeEnabled()
})

Test("game loads", async () => {
  await setupGame()
  await switchToAccount(1)
  // TODO: Right now we don't detect that the player is in a game, implement that.
  await expect(sharedPage.getByRole('button', { name: 'CONCEDE' })).toBeEnabled()
})

// Disable a test by commenting here.
const testsToRun = [
  "connect wallet using default metamask account (first anvil account)",
  // "create then cancel",
  "create & join",
  "connect from other address",
  "join from other address",
  "make sure first player is in the game too",
  // "game loads"
]

// If non-empty, will only run the tests in this array.
const onlyRun = [
  // "game loads"
]

for (const t of definedTests)
  if ((onlyRun.length > 0 ? onlyRun : testsToRun).includes(t.name))
    test(t.name, t.test)