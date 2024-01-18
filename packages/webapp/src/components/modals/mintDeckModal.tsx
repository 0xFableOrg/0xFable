import { useState } from "react"

import { useDeckAirdropWrite } from "src/hooks/useFableWrite"
import { LoadingModalContent } from "src/components/modals/loadingModal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "src/components/ui/dialog"
import { Button } from "src/components/ui/button"

// =================================================================================================

export const MintDeckModal = ({ callback = () => {} }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-lg p-6 font-fable text-2xl border-green-900 border-2 h-16 hover:scale-105 hover:border-green-800 hover:border-3">
          Mint Deck →
        </Button>
      </DialogTrigger>
      <DialogContent>
        <MintDeckModalContent callback={callback} />
      </DialogContent>
    </Dialog>
  )
}

// =================================================================================================

const MintDeckModalContent = ({ callback }: { callback: () => void }) => {
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { write: claim } = useDeckAirdropWrite({
    functionName: "claimAirdrop",
    enabled: true,
    setLoading,
    onSuccess() {
      callback?.()
      setSuccess(true)
    },
  })

  // -----------------------------------------------------------------------------------------------

  if (loading)
    return <LoadingModalContent loading={loading} setLoading={setLoading} />

  return (
    <>
      {!success && (
        <>
          <DialogTitle className="font-fable text-lg">
            Minting Deck...
          </DialogTitle>
          <DialogDescription>
            <p className="py-4 font-mono">
              Mint a deck of cards to play the game with your friends.
            </p>
            <div className="flex justify-center">
              <Button className="font-fable" variant={"secondary"} onClick={claim} disabled={!claim}>
                Mint Deck
              </Button>
            </div>
          </DialogDescription>
        </>
      )}
      {success && (
        <>
          <DialogTitle className="font-fable text-xl">
            Deck Minted Successfully
          </DialogTitle>
          <DialogDescription>
            <p className="py-4">Go enjoy the game!</p>
          </DialogDescription>
        </>
      )}
    </>
  )
}

// =================================================================================================
