import { useAtomsDebugValue, useAtomsDevtools } from "jotai-devtools/index"

const JotaiDebug = () => {
  // An atom that contains a list of all the names and values of all the atoms in the app.
  // This enables inspecting them the in the React devtool extension.
  // (By default in Next, the atoms are listed but they don't have their proper names.)
  // Note that the naming here relies on atoms having their `debugLabel` properties set.
  useAtomsDebugValue()
  // Enables tracking atom value changes in the Redux dev tool, as well as time travelling, etc
  useAtomsDevtools("atomDevtools")
  return null
}

export default function jotaiDebug(isHydrated) {
  return (isHydrated && process.env.NODE_ENV === "development") ? <JotaiDebug /> : null
}