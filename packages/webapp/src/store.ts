import { BigNumberish } from "ethers"
import { atom } from "jotai"

export const gameID          = atom<BigNumberish>(null as BigNumberish)
export const selectedCard    = atom<BigNumberish>(null as BigNumberish)
export const playerHand      = atom<BigNumberish[]>([])
export const playerBoard     = atom<BigNumberish[]>([])
export const playerGraveyard = atom<BigNumberish[]>([])
export const enemyBoard      = atom<BigNumberish[]>([])
export const enemyGraveyard  = atom<BigNumberish[]>([])

export const addToHand = atom(null, (get, set, card: BigNumberish) => {
  set(playerHand, [...get(playerHand), card])
})

export const addToBoard = atom(null, (get, set, card: BigNumberish) => {
  set(playerHand, get(playerHand).filter((c) => c !== card))
  set(playerBoard, [...get(playerBoard), card])
})

export const addToEnemyBoard = atom(null, (get, set, card: BigNumberish) => {
  set(enemyBoard, [...get(enemyBoard), card])
})

export const destroyOwnCard = atom(null, (get, set, card: BigNumberish) => {
  set(playerBoard, get(playerBoard).filter((c) => c !== card))
  set(playerGraveyard, [...get(playerGraveyard), card])
})

export const destroyEnemyCard = atom(null, (get, set, card: BigNumberish) => {
  set(enemyBoard, get(enemyBoard).filter((c) => c !== card))
  set(enemyGraveyard, [...get(enemyGraveyard), card])
})