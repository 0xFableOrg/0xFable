import React, { ReactNode, RefObject, useRef, useState } from "react"

import { useIsMounted } from "src/hooks/useIsMounted"
import { useErrorConfig } from "src/store/hooks"
import { createPortal } from "react-dom"

// =================================================================================================

/**
 * A modal that can be controlled via its {@link ModalController} object (to be created and passed
 * down by the modal's parent).
 *
 * A modal can be loaded or not, and displayed or not. By default, a modal is loaded and displayed.
 *
 * |------------|-------------|--------------------------------------|
 * | `loaded`   | `displayed` | result                               |
 * |------------|-------------|--------------------------------------|
 * | true       | true        | visible, React state & DOM preserved |
 * | true       | false       | hidden, React state & DOM preserved  |
 * | false      | true        | illegal                              |
 * | false      | false       | hidden, React state & DOM lost       |
 * |------------|-------------|--------------------------------------|
 *
 * The following transitions are available:
 * - load()    --> loaded && !displayed (only if !loaded)
 * - display() --> loaded && displayed
 * - close()   --> !loaded && !displayed (or !displayed if closingHides)
 * - hide()    --> loaded && !displayed
 *
 * The modal can be closeable or not. If it is closeable, it can be closed by clicking on the ✕ in
 * the upper right corner, or by hitting the escape key. A closeable modal can also be
 * "surround-closeable", meaning it can be closed by clicking anywhere outside of it. By default, a
 * modal is closeable and surround-closeable. It's possible to change a modal's closeability and
 * surround-closeability during its lifetime.
 *
 * It is possible to make it so that any modal closing action hides it instead (via the
 * `closingHides` property).
 *
 * For more details on interacting with the modal see the {@link ModalController} documentation.
 *
 * In terms of implementation, the modal is split into an outer modal and an inner modal. The outer
 * modal is always rendered, but has minimal logic, being only responsible to render the inner modal
 * or not depending on the value of `loaded`. The inner modal is responsible for rendering the
 * built-in modal look and, the passed down modal's children. It can also hide the modal depending
 * on the value of `displayed`.
 */
export const Modal = ({ ctrl, children }: { ctrl: ModalController, children: ReactNode }) => {

  const [ loaded, setLoaded ] = useState(ctrl.state.loaded)
  const isMounted = useIsMounted()

  ctrl.setLoaded = setLoaded
  ctrl.isMounted = isMounted

  return <>
    {loaded && createPortal(
      <ModalInner ctrl={ctrl}>
      {children}
      </ModalInner>,
      document.body)}
  </>
}

// -----------------------------------------------------------------------------------------------

const ModalInner = ({ ctrl, children }: { ctrl: ModalController, children: ReactNode }) => {

  const [ state, setState ] = useState(ctrl.state)
  ctrl.setState = setState

  const errorConfig = useErrorConfig()
  const dialogRef = useRef(null as HTMLDialogElement|null)

  // If an errorConfig is set, the modal should be hidden.
  const displayed = state.displayed && (!errorConfig || state.displayedOnError)

  // Doing the below dance to show the modal via `showModal` buys us a few things:
  // - focus is restricted to the modal
  // - ESC key closes the modal without custom code (though it's easy to setup) if desired

  const dialogEscapeHandler = (event: Event) => {
    if (!ctrl.state.closeable) // state from useState might be stale!
      // don't close dialog on ESC if it's not closeable
      event.preventDefault()
    else
      // in addition to closing the dialog (default behaviour), this will update the controller state
      ctrl.close()
  }

  const dialogRefCallback = (dialog: HTMLDialogElement|null) => {
    if (dialog === null) return
    dialogRef.current = dialog
    dialog.addEventListener('cancel', dialogEscapeHandler)
    if (displayed && dialog.getAttribute("open") === null)
      // If the modal should be displayed but isn't.
      dialog.showModal()
    if (!displayed && dialog.getAttribute("open") !== null)
      // If the modal should be hidden but isn't.
      dialog.close()
  }

  if (!state.loaded)
    console.error("Modal rendered but its loaded property is false")

  // -----------------------------------------------------------------------------------------------

  return <>
    <dialog ref={dialogRefCallback}
        className={`modal justify-center ${ctrl.state.surroundCloseable ? "cursor-pointer" : ""}`}
        onClick={state.surroundCloseable ? ctrl.close : undefined}
        style={{display: displayed ? "flex" : "none"}}
    >
      <div className="modal-box border-white border cursor-default z-10">
        {state.closeable &&
          <button className="btn btn-sm btn-circle absolute right-2 top-2" onClick={ctrl.close}>
            ✕
          </button>}
        {/* The onClick handler here is crucial to avoid click on buttons etc inside the modal
            from toggling the modal. */}
        <div onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </dialog>
  </>
}

// =================================================================================================

/**
 * Creates a new {@link ModalController} state. The state never changes but having it as a state
 * makes sure there is only one controller over the lifetime of the calling component.
 */
export function useModalController(initial: Partial<ModalState>): ModalController {
  const [ ctrl ] = useState(() => new ModalController(initial))
  return ctrl
}

// =================================================================================================

/**
 * The state of a modal. See {@link Modal} for more detail on the modal's operation.
 */
export type ModalState = {
  /**
   * Whether the modal is loaded (render function called, has React state).
   */
  loaded: boolean
  /**
   * Whether the modal is displayed if loaded (default: true).
   *
   * The modal could still be hidden despite its `displayed` property being true if there is an
   * error (i.e. an {@link ErrorConfig} is set).
   */
  displayed: boolean
  /**
   * Whether the modal is closeable (default: true).
   */
  closeable: boolean
  /**
   * Whether the modal is closeable by clicking outside it, if closeable at all
   * (default: true).
   */
  surroundCloseable: boolean
  /**
   * Whether closing the modal hides it instead of closing it, keeping it rendered in the DOM
   * (default: false).
   */
  closingHides: boolean
  /**
   * Whether the modal should be displayed even if we're displaying an error, i.e. an {@link
   * ErrorConfig} is set (default: false).
   */
  displayedOnError: boolean
}

// -------------------------------------------------------------------------------------------------

/**
 * Encapsulate the modal state (cf. {@link ModalState}) and adds function for updating it and
 * obtaining the desired behavior in React
 *
 * See {@link Modal} for more detail on the modal's operation, including interacting with the
 * controller.
 */
export class ModalController {
  private state_: ModalState
  // @ts-ignore
  private setLoaded_: (_: boolean) => void
  // @ts-ignore
  private setState_: (_: ModalState) => void

  /** Returns a copy of the modal state. */
  get state(): ModalState { return { ...this.state_ } }

  /** Whether the modal is currently displayed. */
  get displayed(): boolean { return this.state_.displayed }

  /**
   * Sets the function needed to udpate the the `loaded` state in the outer modal.
   * Only for use in the modal implementation!
   */
  set setLoaded(setLoaded: (_: boolean) => void) { this.setLoaded_ = setLoaded }

  /**
   * Sets the function needed to udpate the the `state` in the inner modal.
   * Only for use in the modal implementation!
   */
  set setState(setState: (_: ModalState) => void) { this.setState_ = setState }

  /**
   * A reference indicating whether the modal is currently mounted (loaded).
   * This is more reliable than the `state.loaded` because the modal can also unmount if its parent
   * unmount for example.
   */
  // @ts-ignore
  isMounted: RefObject<boolean>

  /** Creates a new modal controller. A new modal controller must be created for every modal. */
  constructor(initial: Partial<ModalState>) {
    this.state_ = {
      loaded: true,
      displayed: true,
      closeable: true,
      surroundCloseable: true,
      closingHides: false,
      displayedOnError: false,
      ...initial
    }
    if (!this.state_.loaded)    this.state_.displayed = false
    if (!this.state_.closeable) this.state_.surroundCloseable = false
  }

  /**
   * All state and `loaded` updates must flow through this function.
   */
  private updateState = (stateUpdate: Partial<ModalState>) => {

    // No state to update, this might be a late callback.
    if (!this.isMounted || !this.isMounted.current) return

    const loaded = this.state_.loaded

    // If loaded is different from current value...
    if (stateUpdate.loaded !== undefined && stateUpdate.loaded !== loaded) {
      this.setLoaded_(stateUpdate.loaded)

      // We need to update this because we might not need to call setState if this is the only
      // update or if this is going to false.
      this.state_.loaded = stateUpdate.loaded

      // Nothing else to do!
      if (Object.keys(stateUpdate).length === 1) return
    }

    const newState = { ...this.state_, ...stateUpdate }
    // Don't setState if there isn't (yet), or won't be an inner modal to update.
    if (loaded && this.state_.loaded) {
      this.setState_(newState)
    }
    // But still set the state here so that the next time the modal is loaded, the state will be
    // change according to the request.
    this.state_ = newState
  }

  /**
   * Loads the modal if not yet loaded, computing its React state and DOM elements, but keeping it
   * hidden.
   */
  readonly load = () => {
    if (this.state_.loaded) return // already in target state
    this.updateState({ loaded: true })
  }

  /**
   * Displays the modal, loading it and making it visible as necessary.
   */
  readonly display = () => {
    if (this.state_.loaded && this.state_.displayed) return // already in target state
    this.updateState({ loaded: true, displayed: true })
  }

  /**
   * Hides the modal, hiding it from view, but keeping its React state and DOM elements.
   */
  readonly hide = () => {
    if (!this.state_.displayed) return // already in target state
    this.updateState({ displayed: false})
  }

  /**
   * Attempt to close the modal by closing it. Note that this will work even if the modal is not
   * closeable! If `closingHides` is true, the modal is hidden instead of closed.
   */
  readonly close = () => {
    // note that !loaded implies !displayed
    if (!this.state_.loaded) return // already in target state
    if (this.state_.closingHides)
      this.updateState({ displayed: false})
    else
      this.updateState({ loaded: false, displayed: false })
  }

  /** Define whether the modal can be closed or hidden. */
  set closeable(closeable: boolean) {
    if (this.state_.closeable === closeable) return // already in target state
    this.updateState({ closeable, surroundCloseable: closeable && this.state_.surroundCloseable })
  }

  /**
   * Define whether the modal can be closed or hidden by clicking outside of it. If the parameter is
   * true, this will also make the modal closeable if it isn't already.
   */
  set surroundCloseable(surroundCloseable: boolean) {
    if (this.state_.surroundCloseable === surroundCloseable) return // already in target state
    this.updateState({ surroundCloseable, closeable: this.state_.closeable || surroundCloseable })
  }

  /**
   * Defines both closeability and surround-closeability at once.
   * This is useful because toggling both properties would otherwise require two state updates.
   */
  set closeableAndSurroundCloseable(closeable: boolean) {
    if (this.state_.closeable === closeable && this.state_.surroundCloseable === closeable)
      return // already in target state
    this.updateState({ closeable, surroundCloseable: closeable })
  }
}

// =================================================================================================