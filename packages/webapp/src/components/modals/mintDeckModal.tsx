import { useState } from "react"

import { ModalMenuButton, ModalTitle, SpinnerWithMargin } from "src/components/lib/modalElements"
import { useDeckAirdropWrite } from "src/hooks/useFableWrite"
import { Modal, ModalController, useModalController } from "src/components/lib/modal"
import { LoadingModalContent } from "src/components/lib/loadingModal"

// =================================================================================================

export const MintDeckModal = ({ callback = () => {} }) => {
  const ctrl = useModalController({ loaded: false })

  return <>
    <ModalMenuButton display={ctrl.display} label="Mint Deck →" />
    <Modal ctrl={ctrl}>
      <MintDeckModalContent ctrl={ctrl} callback={callback} />
    </Modal>
  </>
}

// =================================================================================================

const MintDeckModalContent = ({ ctrl, callback }: { ctrl: ModalController, callback: () => void}) => {
  const [ loading, setLoading ] = useState<string>(null)
  const [ success, setSuccess ] = useState(false)

  const { write: claim } = useDeckAirdropWrite({
    functionName: "claimAirdrop",
    enabled: true,
    setLoading,
    onSuccess() {
      ctrl.display()
      callback?.()
      setSuccess(true)
    }
  })

  // -----------------------------------------------------------------------------------------------

  if (loading) return <LoadingModalContent loading={loading} setLoading={setLoading} />

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

