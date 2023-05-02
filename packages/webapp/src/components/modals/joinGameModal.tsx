import { BigNumber } from "ethers"
import { useAtom } from "jotai"
import debounce from "lodash/debounce"
import { useRouter } from "next/router"
import { useMemo, useState } from "react"
import { CheckboxModal } from "src/components/modals/checkboxModal"
import { ModalMenuButton, ModalTitle, SpinnerWithMargin } from "src/components/modals/modalElements"

import { deployment } from "src/deployment"
import { useGame } from "src/generated"
import { useGameWrite } from "src/hooks/fableTransact"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"
import * as store from "src/store"
import { isStringPositiveInteger } from "src/utils/js-utils"
import { parseBigInt } from "src/utils/rpc-utils"

// =================================================================================================

const JoinGameModalContent = () => {
  const [ inputGameID, setInputGameID ] = useState(null)
  const [ , setGameID ] = useAtom(store.gameID)
  const [ loading, setLoading ] = useState<string>(null)
  const router = useRouter()
  const gameContract = useGame({ address: deployment.Game })

  // NOTE(norswap): Right now, the hook can cause error when you type a number that is not a valid
  //   game ID. This is fine. Alternatively, we could validate the input game ID and enable the hook
  //   only when the ID is valid.

  // Temporary, we do use 0x0 to signal the absence of a root, so we need to use a different value.
  const HashOne = "0x0000000000000000000000000000000000000000000000000000000000000001"

  const { write: join } = useGameWrite({
    functionName: "joinGame",
    args: inputGameID
      ? [
        BigNumber.from(inputGameID),
        0, // deckID
        HashOne, // data for callback
        HashOne, // hand root
        HashOne, // deck root
        HashOne, // proof
      ]
      : undefined,
    enabled: inputGameID !== null,
    setLoading,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0])
      setGameID(parseBigInt(event.args.gameID))
      void router.push("/play")
      setLoading("Joining game...")
    }
  })

  function handleInputChangeBouncy(e) {
    e.stopPropagation()
    if (isStringPositiveInteger(e.target.value))
      setInputGameID(e.target.value)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleInputChange = useMemo(() => debounce(handleInputChangeBouncy, 300), [])

  // -----------------------------------------------------------------------------------------------

  if (loading) return <>
    <ModalTitle>{loading}</ModalTitle>
    <SpinnerWithMargin />
  </>

  return <>
    <ModalTitle>Joining Game...</ModalTitle>
    <p className="py-4">Enter the game ID you want to join.</p>
    <input
      type="number"
      placeholder="Game ID"
      min={0}
      onChange={handleInputChange}
      className="input input-bordered input-primary mr-2 w-full max-w-xs text-white placeholder-gray-500"
    />
    <button
      className="btn"
      disabled={!inputGameID || !join}
      onClick={join}>
      Join Game
    </button>
  </>
}

// =================================================================================================

export const JoinGameModal = () => {
  const modalControl = useCheckboxModal()
  const checkboxID = "join"

  return <>
    <ModalMenuButton htmlFor={checkboxID}>Join →</ModalMenuButton>
    <CheckboxModal id={checkboxID} control={modalControl}>
      <JoinGameModalContent />
    </CheckboxModal>
  </>
}

// =================================================================================================