import { Getter, Setter } from "jotai"
import { serialize as serializeBigInt } from "wagmi"

import { gameID, randomness } from "src/store_old"
import { gameCards_, playerAddress_, playerCardsStore_ } from "src/store_old/private"
import { PlayerCards } from "src/types"

const initialCardsInHand = 5

export function doDrawHand(get: Getter, set: Setter) {
  const ID = get(gameID)
  const stringID = serializeBigInt(ID)
  const player = get(playerAddress_)
  const cards = get(gameCards_)
  const playerCardsStore = get(playerCardsStore_)
  const randomNum = get(randomness)

  // TODO
  console.log("ID", ID)
  console.log("player", player)
  console.log("cards", cards)
  console.log("randomNum", randomNum)

  if (ID === null || player === null || cards === null || randomNum === null) {
    console.warn("Ignoring stale call to drawHand()")
    return
  }
  if (playerCardsStore[stringID]?.[player] != null) {
    console.warn("Ignoring call to drawHand() when we already have cards")
    return
  }
  
  const playerCards: PlayerCards = {
    hand: [],
    deck: cards.decks[player],
    graveyard: []
  }

  for (let i = 0; i < initialCardsInHand; i++)
    drawCard(randomNum, playerCards)
  
  // TODO: add procedure to remove info from old games
  //    (somewhat tedious as it requires an on-chain lookup for every gameID)
  set(playerCardsStore_, {
    ...playerCardsStore,
    [stringID]: {
      ...playerCardsStore[stringID],
      [player]: {
        hand: [],
        deck: cards.decks[player],
        graveyard: []
      }
    }
  })
}

function drawCard(random: bigint, playerCards: PlayerCards) {
  const drawn = Number(random % BigInt(playerCards.deck.length))
  playerCards.hand.push(playerCards.deck[drawn])
  playerCards.deck[drawn] = playerCards.deck.pop()
}