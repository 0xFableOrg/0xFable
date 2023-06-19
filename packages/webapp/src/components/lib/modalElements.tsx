// =================================================================================================

export const ModalTitle = ({ children }) => {
  return <h3 className="text-xl font-bold normal-case">{children}</h3>
}

// -------------------------------------------------------------------------------------------------

export const Spinner = () => {
  return <div className="flex justify-center my-8">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
}

// -------------------------------------------------------------------------------------------------

export const ModalMenuButton = ({ display, label }) => {
  return <button
    onClick={display}
    className="hover:border-3 btn-lg btn btn-neutral border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800">
    {label}
  </button>
}

// =================================================================================================