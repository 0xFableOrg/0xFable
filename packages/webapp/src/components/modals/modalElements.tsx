import { Spinner } from "src/components/spinner"

// =================================================================================================

export const ModalTitle = ({ children }) => {
  return <h3 className="text-xl font-bold normal-case">{children}</h3>
}

// -------------------------------------------------------------------------------------------------

export const SpinnerWithMargin = () => {
  return <div className="flex justify-center my-8">
    <Spinner />
  </div>
}

// =================================================================================================