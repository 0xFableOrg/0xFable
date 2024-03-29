import metamask from "@synthetixio/synpress/commands/metamask.js"

import { test, expect } from "../fixtures"
import { getGameID, setupGame } from "../chain"

// State is shared between tests.
test.describe.configure({ mode: "serial" })

let sharedPage

const definedTests = []

// Whether we're generating proofs. A false value requires running `make dev-noproofs` and deploying
// with `make deploy-noproofs`.
const generateProofs = !process.env["NO_PROOFS"]

// Time to wait for proof generation.
const PROOF_TIME = generateProofs ? 25000 : 0

// The index of the key to use in the Anvil ("test ... junk" mnemonic) private keys.
// Currently unused, but could be used later to test with /?index=0 or /?index=1 and avoid
// the need to maniuplate metamask altogether.
let currentPlayer = 0

function Test(name, test) {
  definedTests.push({ name, test })
}

test.beforeAll(async ({ page }) => {
  sharedPage = page;
  // await sharedPage.goto(`http://localhost:3000/?index=${currentPlayer}`)
  await sharedPage.goto(`http://localhost:3000/`)
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

  await expect(sharedPage.getByRole("button", { name: "0xf39F••••2266"})).toBeVisible()
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
  if (generateProofs)
    // Extra wait time to avoid observed flakiness,
    // seems to be caused by metamask struggling at this point.
    await expect(sharedPage.getByRole("heading",
      { name: "Generating draw proof — may take a minute ..." })).toBeVisible({ timeout: 10000 })
  await expect(sharedPage.getByRole("heading",{ name: "Waiting for signature..." }))
    .toBeVisible({ timeout: PROOF_TIME + 10000 })
  await metamask.confirmTransaction()

  // wait for on-chain inclusion
  await expect(sharedPage.getByRole("heading", { name: "Waiting for other player..." })).toBeVisible()
  currentPlayer = 1
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
  await expect(sharedPage.getByRole("button", { name: "0x7099••••79C8"})).toBeVisible()
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
  if (generateProofs)
    await expect(sharedPage.getByRole("heading",
      {name: "Generating draw proof — may take a minute ..."})).toBeVisible()
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." }))
    .toBeVisible({ timeout: PROOF_TIME + 5000 })
  await metamask.confirmTransaction()
  // Extra wait time to avoid observed flakiness,
  // seems to be caused by metamask struggling at this point.
  await expect(sharedPage.getByRole('button', { name: 'CONCEDE' })).toBeEnabled({ timeout: 10000 })
  currentPlayer = 0
})

Test("make sure first player is in the game too", async () => {
  // NOTE: Currently we stay on the play page after disconnecting Metamask. Is that what we want or
  // do we want to go back to the menu? In any case, the buttons are named the same, so the call
  // here still works.
  await switchToAccount(1)
  // Enabled, not visible, meaning we connected to a player that is recognized as being in the game!
  await expect(sharedPage.getByRole('button', { name: 'CONCEDE' })).toBeEnabled()
})

Test("first player concede games", async () => {
  await sharedPage.getByRole('button', { name: 'CONCEDE' }).click()
  await expect(sharedPage.getByRole("heading", { name: "Waiting for signature..." })).toBeVisible()
  await metamask.confirmTransaction()
  await expect(sharedPage.getByRole("heading", { name: "Game Ended" })).toBeVisible()
  await sharedPage.pause()
  await expect(sharedPage.getByText('Winner: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBeVisible()
  await sharedPage.getByRole("button", { name: "Exit to Menu" }).click()
  await expect(sharedPage.getByRole("button", { name: "Create Game →" })).toBeVisible()
})

Test("game loads", async () => {
  // TODO This is broken after a bunch of changes (namely proof generation),
  //      fix it when game logic needs to be tested.
  await setupGame()
  await switchToAccount(1)
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
  "first player concede games",
  // "game loads"
]

// If non-empty, will only run the tests in this array.
const onlyRun = [
  // "game loads"
]

for (const t of definedTests)
  if ((onlyRun.length > 0 ? onlyRun : testsToRun).includes(t.name))
    test(t.name, t.test)