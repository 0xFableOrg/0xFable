/**
 * An user action responsible for making a player join the game, by sending the `joinGame` and
 * `drawInitialHand` transactions.
 *
 * @module action/joinGame
 */

import { decodeEventLog } from "viem"

import {
  defaultErrorHandling,
  DISMISS_BUTTON,
  FableTimeoutError,
  InconsistentGameStateError
} from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address } from "src/chain"
import { deployment } from "src/deployment"
import { drawInitialHand } from "src/game/drawInitialHand"
import { isGameReadyToStart } from "src/game/status"
import { gameABI } from "src/generated"
import {
  getOrInitPrivateInfo, setError,
  setGameID, setPrivateInfo,
  waitForUpdate
} from "src/store/actions"
import { fetchDeck } from "src/store/network"
import {
  checkFresh,
  freshWrap,
  getGameData,
  getGameID,
  getGameStatus, getPlayerData,
  getPrivateInfo
} from "src/store/read"
import { FetchedGameData, GameStatus, PrivateInfo } from "src/store/types"

// =================================================================================================

/**
 * Temporary stand-in value. Don't use 0x0 as that can be interpreted as lack of initialization in
 * the contracts.
 */
const HashOne = "0x0000000000000000000000000000000000000000000000000000000000000001"

// -------------------------------------------------------------------------------------------------

/**
 * Temporary stand-in value for proofs.
 */
const FakeProof: readonly bigint[] = Array(24).fill(1n)

// =================================================================================================

export type JoinGameArgs = {
  gameID: bigint
  playerAddress: Address
  setLoading: (label: string|null) => void
}

// -------------------------------------------------------------------------------------------------

/**
 * Makes the player join the game, by sending the `joinGame` and `drawInitialHand` transactions.
 *
 * Handles both the game creator joining, as well as a player that isn't currently associated
 * to any game.
 */
export async function joinGame(args: JoinGameArgs): Promise<boolean> {
  try {
    return await joinGameImpl(args)
  } catch (err) {
    args.setLoading(null)

    if (err instanceof FetchDeckError) {
      setError({
        title: "Could not fetch deck",
        message: err.cause.toString(),
        buttons: [DISMISS_BUTTON]
      })
      return false
    }

    return defaultErrorHandling("joinGame", err)
  }
}

// -------------------------------------------------------------------------------------------------

async function joinGameImpl(args: JoinGameArgs): Promise<boolean> {

  const gameID = getGameID()
  const gameStatus = getGameStatus()

  if (gameStatus >= GameStatus.HAND_DRAWN) // works with UNKNOWN
    // We already drew, no need to display an error, this is a stale call,
    // and most likely we're in an aberrant state anwyay.
    return false

  let privateInfo: PrivateInfo|null = getOrInitPrivateInfo(args.gameID, args.playerAddress)

  // TODO
  //    Should initiate proof generation now, should that it proceeds in the background while
  //    sending the joining transactions.

  if (gameStatus < GameStatus.JOINED) {
    const promise = doJoinGameTransaction(args, privateInfo.saltHash)
    if (gameID === null)
      await promise // gameID starts null and the call will set it
    else
      checkFresh(await freshWrap(promise))
  }

  const gameData = getGameData()
  if (gameData === null) // should be impossible due to checkFresh
    throw new InconsistentGameStateError("Missing game data.")

  args.setLoading("Drawing cards...")

  privateInfo = getPrivateInfo(args.gameID, args.playerAddress)
  if (privateInfo === null) // should be impossible due to checkFresh
    throw new InconsistentGameStateError("Missing private info.")

  privateInfo = checkFresh(await freshWrap(
    drawCards(args.gameID, args.playerAddress, gameData, privateInfo, 0 /* deckID */)))

  // Skip checkFresh: no more store access after this.
  await doDrawInitialHandTransaction(args, privateInfo)
  return true
}

// -------------------------------------------------------------------------------------------------

/**
 * Sends the `joinGame` transaction, then waits for the game data to be updated in response.
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
        HashOne, // data for join-check callback
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
    throw new FableTimeoutError("Timed out waiting for up to date game data.")

  // NOTE: Drawing could be done optimistically, though we'll always need a check that the order
  // is indeed what we believed or we risk having the wrong card indexes if a player joined
  // after we started the draw simulation.
}

// -------------------------------------------------------------------------------------------------

/**
 * Sends the `drawInitialHand` transaction, then sets the loading state to "Loading game..." if
 * the game is ready to start.
 */
async function doDrawInitialHandTransaction(args: JoinGameArgs, privateInfo: PrivateInfo) {

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
        FakeProof as any, // proof
      ],
      setLoading: args.setLoading,
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

// -------------------------------------------------------------------------------------------------

/**
 * Fetches the player's deck, then computes the initial hand and deck state for the player, as well
 * as their respective commitments, and store them in the private info store.
 *
 * @returns the updated private info
 * @throws {FetchDeckError} if the deck could not be fetched
 */
export async function drawCards
    (gameID: bigint, player: Address, gameData: FetchedGameData,
     privateInfo: PrivateInfo, deckID: number)
    : Promise<PrivateInfo>{

  const deck = [... checkFresh(await freshWrap(wrappedFetchDeck(player, deckID)))]

  // NOTE: No need to update the game data or the private info here.
  // They couldn't possibly have change.

  const playerData = getPlayerData(gameData, player)
  if (playerData === null) throw new InconsistentGameStateError("Missing player data.")

  const handDeckInfo = drawInitialHand(
      deck, playerData.deckStart, privateInfo.salt, gameData.publicRandomness)

  console.log(`drew initial hand: ${handDeckInfo.hand}`)

  // TODO validate proofs — the setup has been tested, no we just need the actual production proofs
  // TODO this will need to run in a worker thread, not to hogg the main thread
  // checkFresh(await freshWrap(
  //   testProving("MerkleHand", { root: handRoot, leaves: extendedHand })))
  // NOTE: MerkleHand is a circuit defined as:
  //       component main { public [root, leaves] } = CheckMerkleRoot(6);

  const newPrivateInfo = {
    salt: privateInfo.salt,
    saltHash: privateInfo.saltHash,
    ...handDeckInfo,
  }

  setPrivateInfo(gameID, player, newPrivateInfo)
  return newPrivateInfo
}

// -------------------------------------------------------------------------------------------------

/**
 * Wraps an error thrown by {@link fetchDeck}.
 */
class FetchDeckError extends Error {
  cause: any
  constructor(cause: any) {
    super(`Failed to fetch deck: ${cause}`)
    this.cause = cause
  }
}

// -------------------------------------------------------------------------------------------------

/**
 * Calls {@link fetchDeck}, wrapping any thrown error in a {@link FetchDeckError}.
 */
async function wrappedFetchDeck(player: Address, deckID: number): Promise<readonly bigint[]> {
  try {
    return await fetchDeck(player, deckID)
  } catch (err) {
    throw new FetchDeckError(err)
  }
}

// =================================================================================================