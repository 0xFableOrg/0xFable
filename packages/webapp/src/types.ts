/**
 * A set of game-specific types, and functions to derive data from those types.
 *
 * @module types
 */

import { Address, Hash } from "src/chain"
import { zeroAddress } from "viem"

// =================================================================================================
// TYPES

// -------------------------------------------------------------------------------------------------

export type Card = {
  id: bigint
  lore: {
    name: string,
    flavor: string,
    URL: string
  }
  stats: {
    attack: bigint
    defense: bigint
  }
}

// -------------------------------------------------------------------------------------------------

export enum GameStatus {
  UNKNOWN,
  CREATED,
  JOINED,
  STARTED,
  ENDED
}

// -------------------------------------------------------------------------------------------------

export enum GameStep {
  DRAW,
  PLAY,
  ATTACK,
  DEFEND,
  PASS
}

// -------------------------------------------------------------------------------------------------

export type PlayerData = {
  health: number
  deckStart: number
  deckEnd: number
  handRoot: Hash
  deckRoot: Hash
  // Bitfield of cards in the player's battlefield, for each bit: 1 if the card at the same
  // index as the bit in `GameData.cards` is on the battlefield, 0 otherwise.
  battlefield: bigint
  // Bitfield of cards in the player's graveyard (same thing as `battlefield`).
  graveyard: bigint
  attacking: readonly number[]
}

// -------------------------------------------------------------------------------------------------

export type FetchedGameData = {
  gameID: bigint
  gameCreator: Address
  players: readonly Address[]
  playerData: readonly PlayerData[]
  lastBlockNum: bigint
  playersLeftToJoin: number
  livePlayers: readonly number[]
  currentPlayer: number
  currentStep: GameStep
  attackingPlayer: Address
}

// -------------------------------------------------------------------------------------------------

/** All the cards that will be used in the game. */
export type GameCards = {
  gameID: bigint
  /**
   * All the cards that will be used in the game, as represented on-chain, i.e. as a concatenation
   * of all the (initial) players' decks.
   */
  cards: readonly bigint[]
  /**
   * Same as `cards`, but split into (initial) player decks.
   */
  decks: readonly bigint[][]
}

// -------------------------------------------------------------------------------------------------

/**
 * The cards specific to a player, including the cards in their hand, the current
 * ordering of their deck as per updating rules after drawing cards, and their graveyard.
 *
 * Note that the hand and the player deck are *private* information, and cannot be derived from
 * on-chain data.
 */
export type PlayerCards = {
  hand: bigint[]
  deck: bigint[]
  graveyard: bigint[]
}

// -------------------------------------------------------------------------------------------------

/**
 * For storing {@link PlayerCards} in local storage, keyed by gameID (stringified) and player.
 */
export type PlayerCardsStore = {
  [gameID: string]: { [player: Address]: PlayerCards }
}

// =================================================================================================
// DERIVED DATA

/** Returns the address of the current player according to the passed game data. */
export function currentPlayerAddress(gdata: FetchedGameData): Address {
  return gdata.players[gdata.currentPlayer]
}

// -------------------------------------------------------------------------------------------------

/** Returns the game status based on the game data. */
export function getGameStatus(gdata: FetchedGameData, player: Address): GameStatus {
  if (gdata == null || gdata.gameCreator == zeroAddress)
    return GameStatus.UNKNOWN
  else if (gdata.playersLeftToJoin == 0) {
    if (gdata.livePlayers.length <= 1)
      return GameStatus.ENDED
    else
      return GameStatus.STARTED
  } else if (gdata.players.includes(player)) {
    return GameStatus.JOINED
  } else {
    return GameStatus.CREATED
  }
}

// =================================================================================================