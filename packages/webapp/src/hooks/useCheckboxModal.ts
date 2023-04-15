import { useRef } from "react"

export function useCheckboxModal() {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const isModalDisplayed = checkboxRef.current?.checked
  function displayModal(display: boolean) {
    checkboxRef.current.checked = display
  }
  return { checkboxRef, isModalDisplayed, displayModal }
}