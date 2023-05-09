import { useEffect } from "react"
import { CheckboxModal } from "src/components/lib/checkboxModal"
import { SpinnerWithMargin } from "src/components/lib/modalElements"
import { useCheckboxModal } from "src/hooks/useCheckboxModal"

/**
 * This is a modal for displaying loading screens, for use by components that are not themselves
 * modals, and where the display of the modal is meant to be controlled via conditional rendering in
 * the parent component.
 *
 * NOTE: The main benefit of this is avoiding the `useCheckboxModal` hook in the parent component.
 * I'm not sure it's worth the abstraction?
 */
export const LoadingModal = ({ initialDisplay = true, children }) => {
  const checkboxID = "game-end"
  const modalControl = useCheckboxModal(checkboxID)
  // TODO this is ungodly
  if (initialDisplay)
    useEffect(() => { modalControl.displayModal(true) }, [])

  return <CheckboxModal id={checkboxID} control={modalControl}>
    {children}
    <SpinnerWithMargin />
  </CheckboxModal>
}