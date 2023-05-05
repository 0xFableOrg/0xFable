import React, { ReactElement, useEffect, useState } from "react"
import { CheckboxModalControl } from "src/hooks/useCheckboxModal"
import { useEscapeKey } from "src/hooks/useEscapeKey"

// =================================================================================================

export type CheckboxModalProps = {
  id: string
  control: CheckboxModalControl
  initialCloseable?: boolean
  initialSurroundCloseable?: boolean
  children: ReactElement|ReactElement[]
}

// -------------------------------------------------------------------------------------------------

/**
 * A modal whose visibility is controlled by a checkbox. This is orchestrated by {@link
 * useCheckboxModal}, whose result is passed down for the parent (to give the parent the opportunity
 * to control the modal), and can also be passed to the modal's children for the same reasons.
 *
 * Event handlers in the children of the modal MUST use {@link Event.preventDefault} to prevent the
 * element from toggling a surround-closeable modal when clicked. You can use {@link noPropagation}
 * from the utils for this.
 *
 * @param id HTML ID for the checkbox, can be used to create a button that toggles the modal.
 * @param control The control object returned by {@link useCheckboxModal}.
 */
export const CheckboxModal = ({
    id,
    control: {
      checkboxRef,
      checkboxCallback,
      isModalDisplayed,
      displayModal,
      closeableRef,
      surroundCloseableRef },
    initialCloseable = true,
    initialSurroundCloseable = true,
    children }: CheckboxModalProps) =>
{
  // Can't be surround-closeable if not closeable.
  if (!initialCloseable)
    initialSurroundCloseable = false

  const [ closeable, setCloseable ] = useState(initialCloseable)
  const [ surroundCloseable, setSurroundCloseable ] = useState(initialSurroundCloseable)

  // cf. comment in useCheckboxModal on why we do this
  useEffect(() => {
    closeableRef.current = (status) => {
      if (status !== closeable) {
        setCloseable(status)
        if (!status) setSurroundCloseable(false)
      }
    }
    surroundCloseableRef.current = (status) => {
      if (status !== surroundCloseable) setSurroundCloseable(status)
    }
  }, [ closeable, setCloseable, surroundCloseable, setSurroundCloseable ])

  // If closeable and displayed, we can close the modal by pressing the escape key.
  useEscapeKey(closeable && isModalDisplayed, () => displayModal(false))

  // -----------------------------------------------------------------------------------------------

  {/* code adapted from https://daisyui.com/components/modal/ */}
  return <>
    <input type="checkbox" id={id} ref={checkboxRef} onChange={checkboxCallback} className="modal-toggle" />

    {isModalDisplayed && surroundCloseable && <>
      {/* The outer label enables the htmlFor to toggle the checkbox on click.
          We set it to have a pointer (clicker) cursor to indicate this. */}
      <label htmlFor={id} className="modal cursor-pointer">
        <label
            htmlFor="this-id-for-sure-does-no-exist" // override parent htmlFor
            className="modal-box relative border-white border cursor-auto">
          <label htmlFor={id} className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
          {/* The onClick handler here is crucial to avoid click on buttons etc inside the modal
              from toggling the modal. */}
          <div onClick={(e) => e.preventDefault()}>
            {children}
          </div>
        </label>
      </label>
    </>}

    {isModalDisplayed && !surroundCloseable && <>
      {/* Cursor-default is required here otherwise the cursor behaviour is erratic — not sure why. */}
      <div className="modal cursor-pointer cursor-default">
        <div className="modal-box relative border-white border">
          {closeable &&
            <label htmlFor={id} className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>}
          {/* The onClick handler here is crucial to avoid click on buttons etc inside the modal
              from toggling the modal. */}
          <div onClick={(e) => e.preventDefault()}>
            {children}
          </div>
        </div>
      </div>
    </>}
  </>
}

// =================================================================================================