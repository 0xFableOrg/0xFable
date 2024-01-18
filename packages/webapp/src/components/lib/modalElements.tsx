// =================================================================================================

import Image from "next/image"
import { Button } from "src/components/ui/button"

export const Spinner = () => {
  return (
    <div className="flex justify-center my-8">
      <Image
        height={80}
        width={80}
        src={"/img/spinner.svg"}
        alt="loading"
      />
    </div>
  )
}

// -------------------------------------------------------------------------------------------------

export const ModalMenuButton = ({
  display,
  label,
}: {
  display: () => void
  label: string
}) => {
  return (
    <Button variant="outline" onClick={display} className="rounded-lg p-6 font-fable text-2xl border-green-900 border-2 h-16 hover:scale-105 hover:border-green-800 hover:border-3">
      {label}
    </Button>
  )
}

// =================================================================================================
