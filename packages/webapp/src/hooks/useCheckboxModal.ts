import { ChangeEvent, useCallback, useRef, useState } from "react"

export function useCheckboxModal() {

  const [ isModalDisplayed, setModalDisplayed ] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>()

  const checkboxCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setModalDisplayed(event.target.checked)
  }, [setModalDisplayed])

  const displayModal = useCallback((display: boolean) => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = display
      setModalDisplayed(display)
    }
  }, [checkboxRef, setModalDisplayed])

  return { checkboxRef, checkboxCallback, isModalDisplayed, displayModal}
}