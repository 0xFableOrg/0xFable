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
  publicRandomness: bigint
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
 * The player's private info, i.e., his secret salt, the cards currently in their hand, as well as
 * the current ordering of their deck as per updating rules after drawing cards.
 *
 * This information cannot be derived from on-chain data.
 */
export type PrivateInfo = {
  /** The player's secret salt, necessary to hide information. */
  salt: bigint
  /** The player's current hand. */
  hand: bigint[]
  /** The player's current deck ordering. */
  deck: bigint[]
  /** Merkle root of {@link hand}. */
  handRoot: bigint
  /** Merkle root of {@link deck}. */
  deckRoot: bigint
}

// -------------------------------------------------------------------------------------------------

/**
 * For storing {@link PrivateInfo} in local storage, keyed by gameID (stringified) and player.
 */
export type PrivateInfoStore = {
  [gameID: string]: { [player: Address]: PrivateInfo }
}

// -------------------------------------------------------------------------------------------------

/**
 * Public view of the game board, derived from {@link FetchedGameData}.
 */
export type GameBoard = {
  /**
   * Cards in each player's graveyard in the game.
   * Players are ordered as in {@link FetchedGameData.players}.
   */
  graveyard: bigint[][]
  /**
   * Cards on the battlefield, under the control of each player.
   * Players are ordered as in {@link FetchedGameData.players}.
   */
  battlefield: bigint[][]
}

// -------------------------------------------------------------------------------------------------

/** This configure the global error modal to display an error message. */
export type ErrorConfig = {
  title: string
  message: string
  onClose?: () => void
  buttons: readonly {
    text: string
    onClick: () => void
  }[]
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