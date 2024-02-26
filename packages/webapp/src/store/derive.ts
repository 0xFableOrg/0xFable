/**
 * Holds function for deriving data from the store. These functions should not be accessed directly,
 * but via the {@link module:store/read} module. They are also called by the {@link
 * module:store/atoms} module to create derived atoms (which should in turn by accessed via {@link
 * module:store/hooks}).
 *
 * @module store/derive
 */

import { Address } from "src/chain"
import { FetchedGameData, GameStatus, GameStep, PlayerData, PrivateInfo, PrivateInfoStore } from "src/store/types"

// =================================================================================================

/**
 * @see module:store/read#getGameStatus
 */
export function getGameStatus(gdata: FetchedGameData|null, player: Address|null): GameStatus {
  if (gdata === null || player === null)
    return GameStatus.UNKNOWN

  if  (gdata.lastBlockNum === 0n)
    throw new Error("Empty game data object — shouldn't be from Game contract which checks this.")

  if (gdata.currentStep === GameStep.UNINITIALIZED)
    if (!gdata.players.includes(player))
      return GameStatus.CREATED
    else if (gdata.livePlayers.includes(gdata.players.indexOf(player)))
      return GameStatus.HAND_DRAWN
    else
      return GameStatus.JOINED

  if (gdata.currentStep === GameStep.ENDED)
    return GameStatus.ENDED
  else
    return GameStatus.STARTED
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useAllPlayersJoined
 */
export function didAllPlayersJoin(gdata: FetchedGameData|null): boolean {
  return gdata?.playersLeftToJoin === 0
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useIsGameCreator
 */
export function isGameCreator(gdata: FetchedGameData|null, player: Address|null): boolean {
  return player != null && player === gdata?.gameCreator
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useIsGameJoiner
 */
export function isGameJoiner(gdata: FetchedGameData|null, player: Address|null): boolean {
  const createdGame = isGameCreator(gdata, player)
  return !!(player != null && !createdGame && gdata?.players?.includes(player))
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getCards
 */
export function getCards(gdata: FetchedGameData|null): readonly bigint[]|null {
  return gdata?.cards ?? null
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getCurrentPlayerAddress
 * @see module:store/hooks#useCurrentPlayerAddress
 */
export function getCurrentPlayerAddress(gdata: FetchedGameData|null): Address|null {
  if (gdata === null) return null
  return gdata.players[gdata.currentPlayer]
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getPlayerData
 * @see module:store/hooks#usePlayerData
 */
export function getPlayerData(gdata: FetchedGameData|null, player: Address|null): PlayerData|null {
  if (gdata === null || player === null) return null
  const index = gdata.players.indexOf(player)
  if (index < 0) return null
  return gdata.playerData[index] ?? null
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useOpponentAddress
 */
export function getOpponentAddress(gdata: FetchedGameData|null, player: Address|null): Address|null {

  if (gdata == null || player == null) return null
  if (gdata.players.length !== 2)
    throw new Error("Wrong assumption: game doesn't have exactly 2 players.")
  const localIndex = gdata.players.indexOf(player)
  if (localIndex < 0) return null
  return gdata.players[(localIndex + 1) % 2]
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#useOpponentData
 */
export function getOpponentData(gdata: FetchedGameData|null, player: Address|null): PlayerData|null {
  const oppponentAddress = getOpponentAddress(gdata, player)
  return getPlayerData(gdata, oppponentAddress)
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getPrivateInfo
 */
export function getPrivateInfo(gameID: bigint | null, player: Address | null, privateInfoStore: PrivateInfoStore): PrivateInfo | null {
  // Directly return null if either gameID or player is null, or if the specific info does not exist in the store.
  return gameID !== null && player !== null ? 
    privateInfoStore[gameID.toString()]?.[player] || null 
    : null;
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#usePlayerHand
 */
export function getPlayerHand(
    gdata: FetchedGameData|null,
    privateInfo: PrivateInfo|null
): readonly bigint[]|null {
  if (gdata === null  || privateInfo === null) return null
  const handIndexes = privateInfo.handIndexes
  const firstEmpty = handIndexes.indexOf(255)
  const handSize = firstEmpty < 0 ? handIndexes.length : firstEmpty
  return handIndexes
    .slice(0, handSize)
    .map((index) => gdata.cards[index])
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getDeckSize
 */
export function getDeckSize(privateInfo: PrivateInfo): number {
  const firstEmpty = privateInfo.deckIndexes.indexOf(255)
  return firstEmpty < 0 ? privateInfo.deckIndexes.length : firstEmpty
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getOpponentIndex
 */
export function getOpponentIndex(gdata: FetchedGameData|null, player: Address|null): number|null {
  if (gdata == null || player == null) return null
  if (gdata.players.length !== 2)
    throw new Error("Wrong assumption: game doesn't have exactly 2 players.")
  const localIndex = gdata.players.indexOf(player)
  if (localIndex < 0) return null
  return (localIndex + 1) % 2
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#getDeck
 */
export function getDeck(
    pdata: PlayerData|null,
    cards: readonly bigint[]|null,
): bigint[]|null {
  if (pdata === null || cards === null) return null
  return cards.slice(pdata.deckStart, pdata.deckEnd)
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/read#isGameReadyToStart
 */
export function isGameReadyToStart(gdata: FetchedGameData, blockNumber: bigint): boolean {
  return gdata.playersLeftToJoin === 0 &&
    (gdata.lastBlockNum >= blockNumber
      // Depending on whether the game data has already been updated with the results of the
      // drawInitialHand call.
      ? gdata.livePlayers.length === gdata.players.length
      : gdata.livePlayers.length === gdata.players.length - 1)
}

// -------------------------------------------------------------------------------------------------

/**
 * @see module:store/hooks#usePlayerBattlefield
 * @see module:store/hooks#useOpponentBattlefield
 */
export function getBattlefield(
    pdata: PlayerData|null,
    cards: readonly bigint[]|null
): readonly bigint[]|null {
  if (pdata === null || cards === null) return null
  const battlefield = []
  for (let i = pdata.deckStart; i < pdata.deckEnd; i++)
    if (pdata.battlefield & (1n << BigInt(i)))
      battlefield.push(cards[i])
  return battlefield
}

// =================================================================================================