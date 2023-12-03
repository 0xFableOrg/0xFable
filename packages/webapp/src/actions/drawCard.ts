/**
 * An user action responsible for making a player play a card he previously drew, by sending the
 * `playCard` transaction.
 *
 * @module action/playCard
 */

import { defaultErrorHandling } from "src/actions/errors"
import { contractWriteThrowing } from "src/actions/libContractWrite"
import { Address, type HexString } from "src/chain"
import { deployment } from "src/deployment"
import { packCards } from "src/game/fableProofs"
import { gameABI } from "src/generated"
import { getOrInitPrivateInfo, setPrivateInfo } from "src/store/actions"
import {
  checkFresh,
  freshWrap, getCards, getCurrentPlayerAddress, getDeckSize,
  getGameData,
  getGameID,
  getPlayerAddress
} from "src/store/read"
import { GameStep, PrivateInfo } from "src/store/types"
import { FAKE_PROOF, proveInWorker, SHOULD_GENERATE_PROOFS } from "src/utils/zkproofs"
import { bigintToHexString, parseBigInt } from "src/utils/js-utils"
import { mimcHash } from "src/utils/hashing"
import { DRAW_CARD_PROOF_TIMEOUT } from "src/constants"

// =================================================================================================

export type DrawCardArgs = {
  gameID: bigint
  playerAddress: Address
  setLoading: (label: string | null) => void
}

// =================================================================================================

/**
 * Makes the player draw a card (as part of the normal course of his turne), by sending the
 * `drawCard` transactions.
 *
 * Returns `true` iff the player successfully drew the card.
 */
export async function drawCard(args: DrawCardArgs): Promise<boolean> {
  try {
    return await drawCardImpl(args)
  } catch (err) {
    args.setLoading(null)
    return defaultErrorHandling("drawCard", err)
  }
}

async function drawCardImpl(args: DrawCardArgs): Promise<boolean> {

  const gameID = getGameID()
  const playerAddress = getPlayerAddress()
  const gameData = getGameData()

  if (gameID !== args.gameID || playerAddress !== args.playerAddress ||  gameData === null)
    return false // old/stale call

  if (getCurrentPlayerAddress(gameData) !== playerAddress || gameData.currentStep !== GameStep.DRAW)
    return false // old/stale call

  const privateInfo: PrivateInfo = getOrInitPrivateInfo(gameID, playerAddress)

  // Select random card from deck and update deck and hand accordingly.
  const randomness = mimcHash([privateInfo.salt, gameData.publicRandomness])
  const deckSize = getDeckSize(privateInfo)
  const selectedCardIndex = Number(randomness % BigInt(deckSize))
  const selectedCard = privateInfo.deckIndexes[selectedCardIndex]
  const newHand = [...privateInfo.handIndexes]
  const newHandLastIndex = newHand.indexOf(255)
  if (newHandLastIndex < 0)
    throw new Error("Hand is full") // TODO handle this more fundamentally
  newHand[newHandLastIndex] = selectedCard
  const newDeck = [... privateInfo.deckIndexes]
  newDeck[selectedCardIndex] = newDeck[deckSize - 1]
  newDeck[deckSize - 1] = 255
  // TODO use constant
  // TODO abstract this logic away

  const deckRootInputs = [...packCards(newDeck), privateInfo.salt]
  const newDeckRoot: HexString = `0x${bigintToHexString(mimcHash(deckRootInputs), 32)}`
  const handRootInputs = [...packCards(newHand), privateInfo.salt]
  const newHandRoot: HexString = `0x${bigintToHexString(mimcHash(handRootInputs), 32)}`

  const cards = getCards()!
  console.log(`drew card ${cards[selectedCard]}`)

  args.setLoading("Generating draw proof ...")

  // TODO reuse this logic
  const tmpHandSize = privateInfo.handIndexes.indexOf(255)
  const initialHandSize = tmpHandSize < 0
    ? BigInt(privateInfo.handIndexes.length)
    : BigInt(tmpHandSize)

  console.dir({
    // public inputs
    deckRoot: parseBigInt(privateInfo.deckRoot),
    newDeckRoot: parseBigInt(newDeckRoot),
    handRoot: parseBigInt(privateInfo.handRoot),
    newHandRoot: parseBigInt(newHandRoot),
    saltHash: privateInfo.saltHash,
    publicRandom: gameData.publicRandomness,
    initialHandSize,
    lastIndex: BigInt(deckSize - 1),
    // private inputs
    salt: privateInfo.salt,
    deck: packCards(privateInfo.deckIndexes),
    hand: packCards(privateInfo.handIndexes),
    newDeck: packCards(newDeck),
    newHand: packCards(newHand)
  })

  const { proof } = !SHOULD_GENERATE_PROOFS
    ? { proof: FAKE_PROOF }
    : checkFresh(await freshWrap(proveInWorker("Draw", {
        // public inputs
        deckRoot: privateInfo.deckRoot,
        newDeckRoot: newDeckRoot,
        handRoot: privateInfo.handRoot,
        newHandRoot: newHandRoot,
        saltHash: privateInfo.saltHash,
        publicRandom: gameData.publicRandomness,
        initialHandSize,
        lastIndex: BigInt(deckSize - 1),
        // private inputs
        salt: privateInfo.salt,
        deck: packCards(privateInfo.deckIndexes),
        hand: packCards(privateInfo.handIndexes),
        newDeck: packCards(newDeck),
        newHand: packCards(newHand)
    }, DRAW_CARD_PROOF_TIMEOUT)))

  checkFresh(await freshWrap(
    contractWriteThrowing({
      contract: deployment.Game,
      abi: gameABI,
      functionName: "drawCard",
      args: [
        gameID,
        newHandRoot,
        newDeckRoot,
        proof as any // coerce because signature wants precise length
      ],
      setLoading: args.setLoading
    })))

  // TODO: this should be put in an optimistic store, before proof generation
  setPrivateInfo(gameID, playerAddress, {
    ...privateInfo,
    handIndexes: newHand,
    handRoot: newHandRoot,
    deckIndexes: newDeck,
    deckRoot: newDeckRoot
  })

  return true
}

if (typeof window !== "undefined")
  (window as any).drawCard = drawCard

// =================================================================================================