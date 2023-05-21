export type Address = `0x${string}`
export type Hash = `0x${string}`

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

export enum GameStatus {
  UNKNOWN,
  CREATED,
  JOINED,
  STARTED,
  ENDED
}

export enum GameStep {
  DRAW,
  PLAY,
  ATTACK,
  DEFEND,
  PASS
}

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

export type GameCards = {
  gameID: bigint
  cards: readonly bigint[]
  decks: readonly bigint[][]
}