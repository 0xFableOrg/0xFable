import type { BigNumberish } from "ethers"

export type Address = `0x${string}`
export type Hash = `0x${string}`

export type Card = {
  id: BigNumberish
  lore: {
    name: string,
    flavor: string,
    URL: string
  }
  stats: {
    attack: BigNumberish
    defense: BigNumberish
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
  gameCreator: Address
  players: Address[]
  lastBlockNum: BigNumberish
  playersLeftToJoin: BigNumberish
  livePlayers: BigNumberish[]
  currentPlayer: BigNumberish
  currentStep: GameStep
  attackingPlayer: Address
}