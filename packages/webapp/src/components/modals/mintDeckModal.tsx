import { useState } from "react"

import { deployment } from "src/deployment"

import {
  useCardsCollectionWrite,
  useDeckAirdropWrite,
  useInventoryWrite
} from "src/hooks/fableTransact"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"

export const MintDeckModal = ({ callback }) => {
  const [invDelegated, setInvDelegated] = useState(false)
  const [airDelegated, setAirDelegated] = useState(false)
  const { checkboxRef, isModalDisplayed, displayModal } = useCheckboxModal()

  console.log("invDelegated: " + invDelegated)


  const { write: approve } = useCardsCollectionWrite({
    functionName: "setApprovalForAll",
    args: [deployment.Inventory, true],
    enabled: isModalDisplayed,
    onSuccess() {
      setInvDelegated(true)
    },
    onError(err) {
      console.log("approve_err: " + err)
    }
  })

  console.log("approve: " + approve)

  const { write: delegate } = useInventoryWrite({
    functionName: "setDelegation",
    args: [deployment.DeckAirdrop, true],
    enabled: isModalDisplayed && invDelegated,
    onSuccess() {
      setAirDelegated(true)
    },
    onError(err) {
      console.log("delegate_err: " + err)
    }
  })

  const { write: claim } = useDeckAirdropWrite({
    functionName: "claimAirdrop",
    enabled: isModalDisplayed && airDelegated,
    onSuccess() {
      displayModal(false)
      callback?.()
    },
    onError(err) {
      console.log("claim_err: " + err)
    }
  })

  // TODO(LATER): check if we already have the approvals
  // TODO(LATER): pop a modal to indicate that the mint is successful? do something while getting collection

  return (
    <>
      {/* The button to open modal */}
      <label
        htmlFor="my-modal-4"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
      >
        Mint deck →
      </label>

      {/* Put this part before </body> tag */}
      <input type="checkbox" id="my-modal-4" ref={checkboxRef} className="modal-toggle" />
      <label htmlFor="my-modal-4" className="modal cursor-pointer">
        <label className="modal-box relative">
          <h3 className="text-lg font-bold">Minting Deck...</h3>
          <p className="py-4">
            Mint a deck of cards to play the game with your friends.
          </p>
          <button className="btn" onClick={approve} disabled={invDelegated || !approve}>
            Delegate to Inventory
          </button>
          <button className="btn" onClick={delegate} disabled={airDelegated || !invDelegated || !delegate}>
            Delegate to Airdropper
          </button>
          <button className="btn" onClick={claim} disabled={!airDelegated || !claim}>
            Mint Deck
          </button>
        </label>
      </label>
    </>
  )
}
