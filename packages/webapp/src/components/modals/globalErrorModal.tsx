import { ModalTitle } from "src/components/lib/modalElements"
import { Modal, useModalController } from "src/components/lib/modal"
import { ErrorConfig } from "src/types"

/**
 * A modal displayed globally (setup in _app.tsx) whenever the errorConfig state is set to non-null.
 * This modal can be dismissed by setting the errorConfig state to null.
 */
export const GlobalErrorModal = ({ config }: { config: ErrorConfig }) => {
  const ctrl = useModalController({ displayed: true, closeable: false, displayedOnError: true })

  // Maybe in the future we might want to store the error somewhere and make it surfaceable in the
  // UI. This is good practice as it lets the user figure out what happened. Really not a priority
  // at the moment, and the error should be systematically logged to the console instead, for
  // debugging purposes.

  return <Modal ctrl={ctrl}>
    <ModalTitle>{config.title}</ModalTitle>
    {config.message !== "" && <p className="py-4 font-mono">{config.message}</p>}
    <div className="flex justify-center gap-4">
      {config.buttons.map((button, i) =>
        <button key={i} className="btn" onClick={button.onClick}>
          {button.text}
        </button>
      )}
    </div>
  </Modal>
}