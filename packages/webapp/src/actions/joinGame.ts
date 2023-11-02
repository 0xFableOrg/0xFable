/**
 * An user action responsible for making a player join the game, by sending the `joinGame` and
 * `drawInitialHand` transactions.
 *
 * @module action/joinGame
 */

import { decodeEventLog } from "viem"

import {
  defaultErrorHandling,
  FableRequestTimeout,
  InconsistentGameStateError
} from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { drawInitialHand } from "src/game/drawInitialHand"
import { isGameReadyToStart } from "src/game/status"
import { gameABI } from "src/generated"
import {
  getOrInitPrivateInfo,
  setGameID,
  setPrivateInfo,
  waitForUpdate
} from "src/store/actions"
import {
  checkFresh,
  freshWrap, getCards, getDeck,
  getGameData,
  getGameID,
  getGameStatus,
  getPlayerData,
  getPrivateInfo
} from "src/store/read"
import { FetchedGameData, GameStatus, PlayerData, PrivateInfo } from "src/store/types"
import { SHOULD_GENERATE_PROOFS, FAKE_PROOF, ProofOutput, proveInWorker } from "src/utils/zkproofs"
import { NUM_CARDS_FOR_PROOF } from "src/game/constants"
import { packCards } from "src/game/fableProofs"

// =================================================================================================

export type JoinGameArgs = {
  gameID: bigint
  playerAddress: Address
  setLoading: (label: string | null) => void
}

// -------------------------------------------------------------------------------------------------

/**
 * Makes the player join the game, by sending the `joinGame` and `drawInitialHand` transactions.
 *
 * Handles both the game creator joining, as well as a player that isn't currently associated
 * to any game.
 *
 * Returns `true` iff the player successfully joined the game.
 */
export async function joinGame(args: JoinGameArgs): Promise<boolean> {
  try {
    return await joinGameImpl(args)
  } catch (err) {
    args.setLoading(null)
    return defaultErrorHandling("joinGame", err)
  }
}

// -------------------------------------------------------------------------------------------------

async function joinGameImpl(args: JoinGameArgs): Promise<boolean> {

  const gameID = getGameID()
  const gameStatus = getGameStatus()

  if (gameID !== null && gameID !== args.gameID)
    return false // old/stale call

  if (gameStatus >= GameStatus.HAND_DRAWN)
    // We already drew, no need to display an error, this is a stale call,
    // and most likely we're in an aberrant state anwyay.
    return false

  let privateInfo: PrivateInfo | null = getOrInitPrivateInfo(args.gameID, args.playerAddress)

  // NOTE: If we used the creation block for randomness, we could already drawing cards and start
  // generating the proof now. The reason why we don't is that this lets players simulate their
  // hands before joining, which lets them select which games to join. If the creator participates,
  // it lets him create and cancel many games to find one that will advantage him.

  if (gameStatus < GameStatus.JOINED) { // we can skip the join step if already performed
    const promise = doJoinGameTransaction(args, privateInfo.saltHash)
    if (gameID === null)
      await promise // gameID starts null and the call will set it
    else
      checkFresh(await freshWrap(promise))
  }

  args.setLoading("Drawing cards...")

  const gameData = getGameData()
  const cards = getCards()
  if (gameData === null) // should be impossible due to checkFresh usage
    throw new InconsistentGameStateError("Missing game data.")

  privateInfo = getPrivateInfo(args.gameID, args.playerAddress)
  if (privateInfo === null) // should be impossible due to checkFresh usage
    throw new InconsistentGameStateError("Missing private info.")

  const playerData = getPlayerData(gameData, args.playerAddress)
  if (playerData === null)
    throw new InconsistentGameStateError("Missing player data.")

  const deck = getDeck(gameData, cards, args.playerAddress)
  if (deck === null) // should be impossible due to checkFresh usage
    throw new InconsistentGameStateError("Missing player deck.")

  const handDeckInfo = drawInitialHand(
    deck, playerData.deckStart, privateInfo.salt, gameData.publicRandomness)

  privateInfo = {
    salt: privateInfo.salt,
    saltHash: privateInfo.saltHash,
    ...handDeckInfo
  }

  setPrivateInfo(args.gameID, args.playerAddress, privateInfo)

  console.log(`drew initial hand: ${handDeckInfo.hand}`)
  args.setLoading("Generating draw proof — may take a minute ...")

  const { proof } = SHOULD_GENERATE_PROOFS
    ? await generateDrawInitialHandProof(deck, privateInfo, gameData, playerData)
    : { proof: FAKE_PROOF }

  await doDrawInitialHandTransaction(args, privateInfo, proof)
  return true
}

// -------------------------------------------------------------------------------------------------

/**
 * Sends the `joinGame` transaction, then waits for the game data to be updated in response.
 *
 * @throws {StaleError} if the store shifts underneath the transaction.
 */
async function doJoinGameTransaction(args: JoinGameArgs, saltHash: bigint) {

  const result = checkFresh(await freshWrap(
    contractWriteThrowing({
      contract: deployment.Game,
      abi: gameABI,
      functionName: "joinGame",
      args: [
        args.gameID,
        0, // deckID
        saltHash,
        // data for join-check callback — currently unused, just use 1
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ],
      setLoading: args.setLoading
    })))

  if (getGameID() === null) {
    // gameID is null and needs to be set
    const logs = result.receipt.logs
    const event = decodeEventLog({
      abi: gameABI,
      data: logs[0].data,
      topics: logs[0]["topics"]
    })
    setGameID(event.args["gameID"])
  }

  // We need to get the player data in order to draw cards.
  // NOTE: No UI way to navigate away, so no risk to write to a stale component state.
  args.setLoading("Waiting for update...")
  const gameData = checkFresh(await freshWrap(waitForUpdate(result.receipt.blockNumber)))

  if (gameData === null)
    // Null can also be returned if the game data was cleared, but this should be caught by
    // checkFresh, and an exception thrown.
    throw new FableRequestTimeout("Timed out waiting for up to date game data.")
}

// -------------------------------------------------------------------------------------------------

async function generateDrawInitialHandProof(
    deck: bigint[],
    privateInfo: PrivateInfo,
    gameData: FetchedGameData,
    playerData: PlayerData)
    : Promise<ProofOutput> {

  const initialDeckOrdering = new Array(NUM_CARDS_FOR_PROOF)

  // initialDeckOrdering = [deckStart .. deckStart + deck.length] + pad with 255
  for (let i = 0; i < deck.length; i++) initialDeckOrdering[i] = playerData.deckStart + i
  for (let i = deck.length; i < initialDeckOrdering.length; i++) initialDeckOrdering[i] = 255

  return proveInWorker("DrawHand", {
    // public inputs
    initialDeck: packCards(initialDeckOrdering),
    lastIndex: BigInt(deck.length - 1),
    deckRoot: privateInfo.deckRoot,
    handRoot: privateInfo.handRoot,
    saltHash: privateInfo.saltHash,
    publicRandom: gameData.publicRandomness,
    // private inputs
    salt: privateInfo.salt,
    deck: packCards(privateInfo.deckIndexes),
    hand: packCards(privateInfo.handIndexes)
  })
}

// -------------------------------------------------------------------------------------------------

/**
 * Sends the `drawInitialHand` transaction, then sets the loading state to "Loading game..." if
 * the game is ready to start.
 */
async function doDrawInitialHandTransaction
    (args: JoinGameArgs, privateInfo: PrivateInfo, proof: readonly bigint[]) {

  // function drawInitialHand(uint256 gameID, bytes32 handRoot, bytes32 deckRoot, bytes calldata proof)
  const result = checkFresh(await freshWrap(
    contractWriteThrowing({
      contract: deployment.Game,
      abi: gameABI,
      functionName: "drawInitialHand",
      args: [
        args.gameID,
        privateInfo.handRoot,
        privateInfo.deckRoot,
        proof as any // coerce because signature wants precise length
      ],
      setLoading: args.setLoading
    })))

  const gameData = getGameData()
  if (gameData === null) // should be impossible due to checkFresh
    throw new InconsistentGameStateError("Missing game data.")

  // Assuming two players, if we're the last to draw, we just need to wait for (1) the data
  // refresh and (2) loading of the play page. Not displaying a loading modal would just show
  // the old screen, which is janky (feels like our join didnt work).
  // The alternative is an optimistic update of the game status & data.
  if (isGameReadyToStart(gameData, result.receipt.blockNumber))
    // NOTE: possible stale component site
    args.setLoading("Loading game...")
}

// =================================================================================================