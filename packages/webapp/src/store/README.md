# 0xFable Store

The store is the frontend's source of truth for the game state. That state is used in rendering and
when performing actions on behalf of users.

A small part of that state is UI state, but the major part is game state, which must be kept
synchronized with the blockchain.

The absolute simplest way to do that is to use a pure derivation: fetch all the game data from
the chain, and re-derive the local state from it. And that's exactly what we do right now.

The whole game state (minus the private parts, which we need to preciously conserve locally) can be
fetched by calling the `fetchGameState` view function from `Game.sol`.

In the future we will add optimistic updates, see the eponymous section below.

# Architecture

We use the Jotai state management library, which defines the state as "atoms". However, we abstract
Jotai behind interfaces, in case it would be opportune to change the store management strategy or
library later.

The easiest way to understand how this all works is to detail the functionality of the varous files
in the store.

### `atoms.ts`

This file defines the atoms that actually store the state. These atoms are of two kinds: basic
"read/write" atoms that actually store state, and are updated from the chain or from user actions in
the frontend, and "derived" atoms that are computed from the basic atoms (possibly indirectly so,
via other derived atoms).

These atoms *should not* be read directly outside the store. Instead, use `hooks.ts` to read them
from React, and functions from `read.ts` and `write.ts` to read or write the store in async actions.

### `types.ts`

Defines the types used in the store (in the atoms, and derived from them).

### `derive.ts`

Defines the derivation logic from the state held in the basic atoms (or other derived state) to
derived state.

These functions are called by `atoms.ts` to define the derived atoms, but also by `read.ts` to
access the derived state.

Note that some of the derived data has no corresponding atom, as we never need to read it from
React. In those case, derived atoms are not needed, but a function in `read.ts` will exist instead.

### `hooks.ts`

These are minimal wrappers arounds the atoms from `atoms.ts`.

### `read.ts`

Defines functions to read the store. These functions can be used in two ways:

- Without parameters, they will read some input atoms from the store and call the appropriate
  function in `derive.ts`.
- With parameters, they will use the supplied values to call the function in `derive.ts`.

The point of using parameters is that it lets us reuse previously read state, which ensures
consistency between that state and the derived state. This is useful when doing async operations
that call `await`, as every `await` is an opportunity for the state to be updated, meaning that
the state before and after the `await` may be inconsistent.

### `write.ts`

Defines functions for async operations to write to the store.

### `setup.ts`

Sets up a number of subscriptions to update the store. In particular, the store updates whenever,
the player, chain, or game ID changes.

It also sets up an interval timer to periodically update the game data.

Most of the update logic is in `update.ts`.

### `update.ts`

This defines the function to update the state, in response to the changes listed in `setup.ts`.

It is also defines the all-important logic (`refreshGameData`) to update the game data from the
blockchain.

`refreshGameData` is called by the interval timer in `setup.ts`, and also by our event subscriptions
(see `subscriptions.ts`). Whenever we receive an event that may have changed the game data, we call
`refreshGameData` to make sure we have the latest version.

### `network.ts`

Defines functions to fetch blockchain data (currently only the game state and player's deck), taking
care of various things such as retries, throttling, filtering zombies (i.e., a request completing
after a more recent one completed for the same data).

**Currently**, the function to update the game data is exclusively called by `refreshGameData`,
while the function the fetch player's deck is called by the logic executed when the player joins a
game.

### `subscriptions.ts`

Event subscriptions, which are set up in `update.ts` whenever a player joins a game.

Currently, we mostly just refresh the game data when required, but in the future we will to add
logic there to "semi-optimistically" update the data, as we usually receive event notifications
before we receive confirmation that a transaction was included in a block.

### `checkFresh.ts`

Above, we alluded to the problem that occur when an async function calls `await`, as the state may
change at that time and read from the store may be inconsistent before and after the call.

Given the turn-based nature of the game, this is rarely an issue, however it could be if the
network, player address, or game ID changes.

To solve this, we defined two functions — `freshWrap` and `checkFresh` and mandate that all
`await` calls must be wrapped like this: `checkFresh(await freshWrap(myAsyncCall()))`.

This construction saves the essential state bits before `await` (network, player, game ID), and
check that they remain the same after returning from `await`. If they changed, it throws a
`StaleError`.

# Optimistic Updates

In the future, we will introduce "optimistic updates", where we update the local state before having
had confirmation that the state changed on the blockchain. This helps make the game feel more
snappy, but must be handled carefully.

These optimistic updates can be triggered once the player initiates an action, or when we receive an
event from our chain subscriptions (normally we'd have to wait an extra roundtrip to the blockchain
to fetch the new state in both of these cases).