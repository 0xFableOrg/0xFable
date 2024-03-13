// =================================================================================================

import Image from "next/image"

import { Button } from "src/components/ui/button"

export const Spinner = () => {
    return (
        <div className="my-8 flex justify-center">
            <Image height={80} width={80} src={"/img/spinner.svg"} alt="loading" />
        </div>
    )
}

// -------------------------------------------------------------------------------------------------

export const ModalMenuButton = ({ display, label }: { display: () => void; label: string }) => {
    return (
        <Button
            variant="outline"
            onClick={display}
            className="hover:border-3 h-16 rounded-lg border-2 border-green-900 p-6 font-fable text-2xl hover:scale-105 hover:border-green-800"
        >
            {label}
        </Button>
    )
}

// =================================================================================================
