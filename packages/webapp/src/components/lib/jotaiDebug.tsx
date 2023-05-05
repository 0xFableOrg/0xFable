import { useAtomsDebugValue, useAtomsDevtools } from "jotai-devtools/index"

const JotaiDebug = () => {
  // An atom that contains a list of all the names and values of all the atoms in the app.
  // This enables inspecting them the in the React devtool extension.
  // (By default in Next, the atoms are listed but they don't have their proper names.)
  // Note that the naming here relies on atoms having their `debugLabel` properties set.
  useAtomsDebugValue()
  // Enables tracking atom value changes in the Redux dev tool, as well as time travelling, etc
  // The Redux dev tool needs to be open and a state change to happen for it to display anything.
  useAtomsDevtools("atomDevtools")
  return null
}

export default function jotaiDebug() {
  // The first clause guards against server-side rendering.
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development")
    return <JotaiDebug />
  else
    return null
}