import { ReactNode } from "react"

import { ModalTitle, Spinner } from "src/components/lib/modalElements"
import { Modal, ModalController } from "src/components/lib/modal"

// =================================================================================================

export type LoadingModalProps = {
  ctrl?: ModalController
  /** Whether the modal can be dismissed via a cancel button. */
  cancellable?: boolean
  /** A string that is displayed as the title of the modal. */
  loading: string|null
  /**
   * A way to change the loading string. It's assumed that when this is set to null, the modal will
   * be dismissed.
   */
  setLoading: (_: string|null) => void
  children?: ReactNode
}

// =================================================================================================

/**
 * A modal for displaying loading screens, for use by components that are not themselves modals, as
 * it wraps {@link LoadingModalContent}.
 */
export const LoadingModal = (props: LoadingModalProps & { ctrl: ModalController }) => {

  return <Modal ctrl={props.ctrl}>
    <LoadingModalContent {...props} />
  </Modal>
}

// =================================================================================================

/**
 * This is a modal for displaying loading screens, for use by components that are not themselves
 * modals, and where the display of the modal is meant to be controlled via conditional rendering in
 * the parent component.
 *
 * NOTE: The main benefit of this is avoiding the `useCheckboxModal` hook in the parent component.
 * I'm not sure it's worth the abstraction?
 */
export const LoadingModalContent =
  ({ cancellable = true, loading, setLoading, children }: LoadingModalProps) => {

  return <>
    <ModalTitle>{loading}</ModalTitle>
    {children}
    <Spinner />
    {cancellable && <div className="flex justify-center">
      <button className="btn center" onClick={() => setLoading(null)}>
        Cancel
      </button>
    </div>}
  </>
}

// =================================================================================================