import { BigNumberish } from "ethers"

export type Card = {
  id: BigNumberish,
  lore: {
    name: string,
    flavor: string,
    URL: string
  },
  stats: {
    attack: BigNumberish,
    defense: BigNumberish
  }
}