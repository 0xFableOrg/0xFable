import type { BigNumberish } from "ethers"

// TODO use in transact hooks
export type Address = `0x${string}`

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

enum GameStep {
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
  currentPlayer: BigNumberish
  currentStep: GameStep
  attackingPlayer: Address
}