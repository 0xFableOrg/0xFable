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

export type StaticGameData = {
  gameID: bigint
  gameCreator: Address
  players: readonly Address[]
  lastBlockNum: bigint
  playersLeftToJoin: number
  livePlayers: readonly number[]
  currentPlayer: number
  currentStep: GameStep
  attackingPlayer: Address
}