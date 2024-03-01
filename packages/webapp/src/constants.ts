/**
 * Constants that don't logically belong somewhere else.
 *
 * @module constants
 */

export const GIT_REPO = "https://github.com/0xFableOrg/0xFable"
export const GIT_ISSUES = `${GIT_REPO}/issues`

/** Proof generation timeout (in seconds) for the proof of the initial hand. */
export const DRAW_HAND_PROOF_TIMEOUT = 60

/** Proof generation timeout (in seconds) for the proof of drawing a card. */
export const DRAW_CARD_PROOF_TIMEOUT = 30

/** Proof generation timeout (in seconds) for the proof of playing a card. */
export const PLAY_CARD_PROOF_TIMEOUT = 30

/** The default throttle period (minimum time between two on-chain fetches) in milliseconds. */
export const DEFAULT_THROTTLE_PERIOD  = 2000

/**
 * How often to refresh the state of the game (in milliseconds) — note the state will usually
 * refresh when we receive an event.
 *
 * Also note that the fetched are throttled to max one per {@link DEFAULT_THROTTLE_PERIOD} via
 * {@link module:throttledFetch}.
 */
export const GAME_DATA_REFRESH_INTERVAL = 5000