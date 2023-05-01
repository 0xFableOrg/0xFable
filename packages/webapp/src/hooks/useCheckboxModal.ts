import { ChangeEvent, MutableRefObject, useCallback, useRef, useState } from "react"

// =================================================================================================

/** cf. {@link useCheckboxModal} and {@link CheckboxModal} */
export type CheckboxModalControl = {

  /** Ref to the checkbox that controls the modal's visibility. */
  checkboxRef: MutableRefObject<HTMLInputElement>

  /** `onChange` callback for the checkbox, setting `isModalDisplayed` accordingly. */
  checkboxCallback: (event: ChangeEvent<HTMLInputElement>) => void

  /** Whether the modal is currently displayed. */
  isModalDisplayed: boolean

  /** Display or hide the modal. */
  displayModal(display: boolean): void

  /** Ref to be filled by the modal with its setter for its closeable state. */
  closeableRef: MutableRefObject<(boolean) => void>

  /** Ref to be filled by the modal with its setter for its surround-closeable state. */
  surroundCloseableRef: MutableRefObject<(boolean) => void>

  /**
   * Make the modal closeable, or not.
   * This is guaranteed not to trigger a render loop if repeatedly called with the same value.
   */
  setModalCloseable(closeable: boolean): void

  /**
   * Make the modal closeable by clicking outside of it, or not.
   * A modal that is not closeable, will never be surround-closeable.
   *
   * This is guaranteed not to trigger a render loop if repeatedly called with the same value.
   */
  setModalSurroundCloseable(surroundCloseable: boolean): void
}

// -------------------------------------------------------------------------------------------------

export type CheckboxModalContentProps = {
  modalControl: CheckboxModalControl
} & Record<string, any>

// -------------------------------------------------------------------------------------------------

/**
 * This hook sets up the logic for a modal controlled by a checkbox, which is a component
 * implemented by {@link CheckboxModal}.
 *
 * The returned object enables displaying or hiding the modal (via {@link
 * CheckboxModalControl.displayModal}), knowing whether the modal is displayed (via {@link
 * CheckboxModalControl.isModalDisplayed}) and setting the modal be to closeable or not, and if
 * closeable, whether it can be closed by clicking outside of it. The other fields are for internal
 * use by {@link CheckboxModal}.
 */
export function useCheckboxModal(): CheckboxModalControl {

  const [ isModalDisplayed, setModalDisplayed ] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>()

  // The reason to use these, which will be filled with the a function that calls setState methods
  // in the modal, is that using state instead would force re-rendering the parent of the modal
  // whenever we change the closeability of the modal, which is almost never useful.
  const closeableRef = useRef<(boolean) => void>()
  const surroundCloseableRef = useRef<(boolean) => void>()

  const checkboxCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setModalDisplayed(event.target.checked)
  }, [setModalDisplayed])

  const displayModal = useCallback((display: boolean) => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = display
      setModalDisplayed(display)
    }
  }, [checkboxRef, setModalDisplayed])

  const setModalCloseable = useCallback((closeable: boolean) => {
    closeableRef.current(closeable)
  }, [closeableRef])

  const setModalSurroundCloseable = useCallback((surroundCloseable: boolean) => {
    surroundCloseableRef.current(surroundCloseable)
  }, [surroundCloseableRef])

  return {
    checkboxRef,
    checkboxCallback,
    isModalDisplayed,
    displayModal,
    closeableRef,
    surroundCloseableRef,
    setModalCloseable,
    setModalSurroundCloseable,
  }
}

// =================================================================================================