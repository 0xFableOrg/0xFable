import { ErrorConfig } from "src/store/types"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "src/components/ui/button"
import { useEffect, useState } from "react"

/**
 * A modal displayed globally (setup in _app.tsx) whenever the errorConfig state is set to non-null.
 * This modal can be dismissed by setting the errorConfig state to null.
 */
export const GlobalErrorModal = ({ config }: { config: ErrorConfig }) => {
  // Maybe in the future we might want to store the error somewhere and make it surfaceable in the
  // UI. This is good practice as it lets the user figure out what happened. Really not a priority
  // at the moment, and the error should be systematically logged to the console instead, for
  // debugging purposes.
  const [ open, setOpen ] = useState<boolean>(false)
  useEffect(() => {
    if(config !== null && !open) setOpen(true)
    else setOpen(false)
  }, [config, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent>
        {config.message !== "" && (
          <p className="py-4 font-mono">{config.message}</p>
        )}
        <div className="flex justify-center gap-4">
          {config.buttons.map((button, i) => (
            <Button key={i} variant={"secondary"} onClick={button.onClick}>
              {button.text}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
