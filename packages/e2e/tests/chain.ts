import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  getContract, HDAccount,
  http,
  TransactionReceipt
} from "viem"
import { mnemonicToAccount } from "viem/accounts"
import { localhost } from "viem/chains"

globalThis.exports = {}
global.exports = {}

import { gameABI } from "../../webapp/src/generated"
import { deployment } from "../../webapp/src/deployment"

const publicClient = createPublicClient({
  chain: localhost,
  transport: http()
})

const walletClient = createWalletClient({
  chain: localhost,
  transport: http()
})

const mnemonic = "test test test test test test test test test test test junk"
const account1 = mnemonicToAccount(mnemonic, { addressIndex: 0 })
const account2 = mnemonicToAccount(mnemonic, { addressIndex: 1 })

const game = getContract({
  address: deployment.Game,
  abi: gameABI,
  publicClient,
  walletClient
})

export async function createGame(): Promise<bigint> {
  const hash = await game.write.createGame([2], {
    chain: localhost,
    account: account1
  })
  const tx: TransactionReceipt = await publicClient.waitForTransactionReceipt({ hash })
  const gameCreatedEvent = decodeEventLog({
    abi: gameABI,
    data: tx.logs[0].data,
    topics: tx.logs[0]["topics"]
  })
  return gameCreatedEvent.args["gameID"]
}

// Temporary, we do use 0x0 to signal the absence of a root, so we need to use a different value.
const HashOne = "0x0000000000000000000000000000000000000000000000000000000000000001"

export async function joinGame(account: HDAccount, gameID: bigint): Promise<void> {
  const hash = await game.write.joinGame([
    gameID,
    0, // deckID
    HashOne, // data for callback
    HashOne, // hand root
    HashOne, // deck root
    HashOne, // proof
  ], {
    chain: localhost,
    account
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

export async function setupGame(): Promise<void> {
  const gameID = await createGame()
  await joinGame(account1, gameID)
  await joinGame(account2, gameID)
}

export async function getGameID(): Promise<bigint> {
  return await game.read.inGame([ account1.address ])
}