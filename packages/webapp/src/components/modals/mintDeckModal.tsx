import { useState } from "react"

import { CheckboxModal } from "src/components/modals/checkboxModal"
import { ModalTitle } from "src/components/modals/modalElements"
import { deployment } from "src/deployment"
import {
  useCardsCollectionWrite,
  useDeckAirdropWrite,
  useInventoryWrite
} from "src/hooks/fableTransact"
import { CheckboxModalContentProps, useCheckboxModal } from "src/hooks/useCheckboxModal"

// =================================================================================================

const MintDeckModalContent = ({ modalControl, callback }: CheckboxModalContentProps) => {
  const [invDelegated, setInvDelegated] = useState(false)
  const [airDelegated, setAirDelegated] = useState(false)

  const { write: approve } = useCardsCollectionWrite({
    functionName: "setApprovalForAll",
    args: [deployment.Inventory, true],
    onSuccess() {
      setInvDelegated(true)
    }
  })

  const { write: delegate } = useInventoryWrite({
    functionName: "setDelegation",
    args: [deployment.DeckAirdrop, true],
    enabled: invDelegated,
    onSuccess() {
      setAirDelegated(true)
    }
  })

  const { write: claim } = useDeckAirdropWrite({
    functionName: "claimAirdrop",
    enabled: airDelegated,
    onSuccess() {
      modalControl.displayModal(false)
      callback?.()
    }
  })

  // TODO(LATER): check if we already have the approvals
  // TODO(LATER): pop a modal to indicate that the mint is successful? do something while getting collection

  // -----------------------------------------------------------------------------------------------

  return <>
    <ModalTitle>Minting Deck...</ModalTitle>
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
  </>
}

// =================================================================================================

export const MintDeckModal = () => {
  const modalControl = useCheckboxModal()

  return <>
    <label
      htmlFor="mint"
      className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800">
      Mint Deck →
    </label>
    <CheckboxModal
      id="mint"
      initialCloseable={true}
      initialSurroundCloseable={true}
      control={modalControl}>
      <MintDeckModalContent modalControl={modalControl} />
    </CheckboxModal>
  </>
}

// =================================================================================================

