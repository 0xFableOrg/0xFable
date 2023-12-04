import { ReactNode, useCallback } from "react"

import { ModalTitle, Spinner } from "src/components/lib/modalElements"
import { Modal, ModalController } from "src/components/lib/modal"

// =================================================================================================

/**
 * This class is used to register and deregister cancellation callbacks, and call them once the
 * modal is explicitly cancelled by the user.
 *
 * The recommended way to obtain an instance of this class is via the {@link
 * module:hooks/useCancellationHandler#useCancellationHandler} hook.
 */
export class CancellationHandler {
  private callbacks: (() => void)[] = []

  /** Register a callback to be called when the modal is cancelled. */
  register = (callback: () => void) => {
    this.callbacks.push(callback)
  }

  /** Deregister a callback. */
  deregister = (callback: () => void) => {
    this.callbacks = this.callbacks.filter(cb => cb !== callback)
  }

  /** Call all registered callbacks. */
  cancel = () => {
    this.callbacks.forEach(cb => cb())
  }
}

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
  /**
   * A cancellation handler that can be used to register callbacks to be called when the modal is
   * cancelled via its "cancel" button.
   */
  cancellationHandler?: CancellationHandler
  children?: ReactNode
}

// =================================================================================================

/**
 * A modal for displaying loading screens, for use by components that are not themselves modals, as
 * it wraps {@link LoadingModalContent}.
 *
 * The display of this modal should be controlled via conditional rendering in the parent component,
 * bsed on whether the loading state is populated or not.
 */
export const LoadingModal = (props: LoadingModalProps & { ctrl: ModalController }) => {

  return <Modal ctrl={props.ctrl}>
    <LoadingModalContent {...props} />
  </Modal>
}

// =================================================================================================

/**
 * This is modal content for displaying loading screens. The parent of this component should be a
 * modal.
 *
 * The display of this content should be controlled via conditional rendering in the parent or
 * grandparent, depending on whether the loading state is populated or not.
 */
export const LoadingModalContent =
  ({ cancellable = true, loading, setLoading, cancellationHandler, children }: LoadingModalProps) => {

  const cancel = useCallback(() => {
    setLoading(null)
    cancellationHandler?.cancel()
  }, [setLoading, cancellationHandler])

  return <>
    <ModalTitle>{loading}</ModalTitle>
    {children}
    <Spinner />
    {cancellable && <div className="flex justify-center">
      <button className="btn center" onClick={cancel}>
        Cancel
      </button>
    </div>}
  </>
}

// =================================================================================================