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
  freshWrap, getCards, getCurrentPlayerAddress,
  getGameData,
  getGameID,
  getPlayerAddress
} from "src/store/read"
import { GameStep, PrivateInfo } from "src/store/types"
import { FAKE_PROOF, proveInWorker, SHOULD_GENERATE_PROOFS } from "src/utils/zkproofs"
import { bigintToHexString } from "src/utils/js-utils"
import { mimcHash } from "src/utils/hashing"
import { PLAY_CARD_PROOF_TIMEOUT } from "src/constants"
import { CancellationHandler } from "src/components/lib/loadingModal"

// =================================================================================================

export type PlayGameArgs = {
  gameID: bigint
  playerAddress: Address
  cardIndexInHand: number
  setLoading: (label: string | null) => void
  cancellationHandler: CancellationHandler
}

// =================================================================================================

/**
 * Makes the player play a card, by sending the `playCard` transaction.
 *
 * Returns `true` iff the player successfully played the card.
 */
export async function playCard(args: PlayGameArgs): Promise<boolean> {
  try {
    return await playCardImpl(args)
  } catch (err) {
    args.setLoading(null)
    return defaultErrorHandling("playCard", err)
  }
}

// -------------------------------------------------------------------------------------------------

async function playCardImpl(args: PlayGameArgs): Promise<boolean> {
  const gameID = getGameID()
  const playerAddress = getPlayerAddress()
  const gameData = getGameData()

  if (gameID !== args.gameID || playerAddress !== args.playerAddress || gameData === null)
    return false // old/stale call

  if (getCurrentPlayerAddress(gameData) !== playerAddress || gameData.currentStep !== GameStep.PLAY)
    return false // old/stale call

  const privateInfo: PrivateInfo = getOrInitPrivateInfo(gameID, playerAddress)

  let lastIndex = privateInfo.handIndexes.findIndex((card) => card === 255) - 1
  if (lastIndex < 0) lastIndex = privateInfo.handIndexes.length - 1

  const hand = [...privateInfo.handIndexes]
  const card = hand[args.cardIndexInHand]
  hand[args.cardIndexInHand] = hand[lastIndex]
  hand[lastIndex] = 255

  const oldHandRoot = privateInfo.handRoot

  const handRootInputs = [...packCards(hand), privateInfo.salt]
  const newHandRoot: HexString = `0x${bigintToHexString(mimcHash(handRootInputs), 32)}`

  const cards = getCards()!
  console.log(`played card ${cards[card]}`)

  args.setLoading("Generating play proof ...")

  let proof = FAKE_PROOF

  if (SHOULD_GENERATE_PROOFS) {
    const { promise, cancel } = proveInWorker("Play", {
      // public inputs
      handRoot: oldHandRoot,
      newHandRoot: newHandRoot,
      saltHash: privateInfo.saltHash,
      cardIndex: BigInt(args.cardIndexInHand),
      lastIndex: BigInt(lastIndex),
      playedCard: BigInt(card),
      // private inputs
      salt: privateInfo.salt,
      hand: packCards(privateInfo.handIndexes),
      newHand: packCards(hand)
    }, PLAY_CARD_PROOF_TIMEOUT)

    args.cancellationHandler.register(cancel)
    proof = checkFresh(await freshWrap(promise)).proof
    args.cancellationHandler.deregister(cancel)
  }

  checkFresh(await freshWrap(
    contractWriteThrowing({
      contract: deployment.Game,
      abi: gameABI,
      functionName: "playCard",
      args: [
        gameID,
        newHandRoot,
        args.cardIndexInHand,
        card,
        proof as any // coerce because signature wants precise length
      ],
      setLoading: args.setLoading
    })))

  // TODO: This should be put in an optimistic store before sending the transaction.
  ///      CAREFUL to check the values from here passed to the various functions.
  setPrivateInfo(gameID, playerAddress, {
    ...privateInfo,
    handIndexes: hand,
    handRoot: newHandRoot
  })

  return true
}

// =================================================================================================