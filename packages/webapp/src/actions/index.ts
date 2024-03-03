/**
 * The `actions` module contains the implementation of user-initiated actions. These typically span
 * over the store, the UI, and the network (currently only the blockchain via wagmi).
 *
 * This package re-exports the actions from the other packages as well as utilities that can be
 * called from the UI. In general the UI should only import from this package and not from the
 * sub-packages.
 *
 * @module actions
 */

export { joinGame } from "actions/joinGame"
export { reportInconsistentGameState } from "actions/errors"
