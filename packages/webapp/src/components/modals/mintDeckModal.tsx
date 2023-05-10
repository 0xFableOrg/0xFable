import { useEffect, useState } from "react"

import { CheckboxModal } from "src/components/lib/checkboxModal"
import { ModalMenuButton, ModalTitle, SpinnerWithMargin } from "src/components/lib/modalElements"
import { useDeckAirdropWrite } from "src/hooks/fableTransact"
import { CheckboxModalContentProps, useCheckboxModal } from "src/hooks/useCheckboxModal"

// =================================================================================================

const MintDeckModalContent = ({ modalControl, callback }: CheckboxModalContentProps) => {
  const [ loading, setLoading ] = useState<string>(null)
  const [ success, setSuccess ] = useState(false)

  const { write: claim } = useDeckAirdropWrite({
    functionName: "claimAirdrop",
    enabled: true,
    setLoading,
    onSuccess() {
      modalControl.displayModal(false)
      callback?.()
      setSuccess(true)
    }
  })

  // -----------------------------------------------------------------------------------------------

  if (loading) return <>
    <ModalTitle>{loading}</ModalTitle>
    <SpinnerWithMargin />
  </>

  return <>
    {!success && <>
      <ModalTitle>Minting Deck...</ModalTitle>
      <p className="py-4">
        Mint a deck of cards to play the game with your friends.
      </p>
      <div className="flex justify-center">
        <button className="btn flex content-center" onClick={claim} disabled={!claim}>
          Mint Deck
        </button>
      </div>
    </>}
    {success && <>
      <ModalTitle>Deck Minted Successfully</ModalTitle>
      <p className="py-4">
        Go enjoy the game!
      </p>
    </>}
  </>
}

// =================================================================================================

export const MintDeckModal = ({ callback = () => {} }) => {
  const checkboxID = "mint"
  const modalControl = useCheckboxModal(checkboxID)

  return <>
    <ModalMenuButton htmlFor={checkboxID}>Mint Deck →</ModalMenuButton>
    <CheckboxModal id="mint" control={modalControl}>
      <MintDeckModalContent modalControl={modalControl} callback={callback} />
    </CheckboxModal>
  </>
}

// =================================================================================================

