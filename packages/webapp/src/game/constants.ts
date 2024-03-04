/**
 * Game-logic related constants.
 *
 * @module game/constants
 */

// =================================================================================================

/** Size of the initial hand. */
export const INITIAL_HAND_SIZE = 7

/** Maximum size of a deck. */
export const MAX_HAND_SIZE = 62

/** Maximum size of a hand (same as the deck = no limit). */
export const MAX_DECK_SIZE = 62

/**
 * Size of a field element in bytes, in the field used by our chosen ZK scheme. In our case, we use
 * Circom/snarkjs' implementation of Plonk with the BN128 (aka BN254, alt_bn_128) curve.
 *
 * This should always be lower or equal to 32, to fit in a uint256 EVM word.
 */
export const FELT_SIZE = 31

/**
 * Number of field elements needed to represent a deck or a hand.
 *
 * This means that the maximum technical limit of deck and hand size is `NUM_FELTS_FOR_CARDS *
 * FELT_SIZE`.
 */
export const NUM_FELTS_FOR_CARDS = 2

/**
 * The number of cards to provide for proofs over a deck or a hand,
 * equal to `NUM_FELTS_FOR_CARDS * FELT_SIZE`.
 */
export const NUM_CARDS_FOR_PROOF = NUM_FELTS_FOR_CARDS * FELT_SIZE

// NOTE: If we were willing to restrict the number of cards in a hand more strictly, we could use
// use only one field elements for hands. We would need separate set of constants to handle both
// cases.

/**
 * The prime that bounds the field used by our proof scheme of choice.
 * Currently, this is for Plonk.
 */
export const PROOF_CURVE_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617n

// =================================================================================================
