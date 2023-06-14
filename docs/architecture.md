## Table of Contents

- [Introduction](#introduction)
- [Gameplay](#gameplay)
- [Game Components](#game-components)
- [Contracts](#contracts)
  - [Cards and Inventory](#cards-and-inventory)
  - [`Game.sol`](#gamesol)
- [Randomness](#randomness)
- [Private Information](#private-information)
- [Zero-Knowledge Circuits](#zero-knowledge-circuits)
- [Frontend](#frontend)

## Introduction

This document explains how the game works: first an overview of the currently implemented game
mechanics, followed by an overview of the various components that make up the game.

But first: what is the game? It's a fully on-chain trading card game. Famous trading card games
include Magic: The Gathering, Hearthstone, The Pokémon TCG, Yu-Gi-Oh, and many more.

If you've never encountered a TCG before, [here's a commentary-less video of Hearthstone
gameplay](https://www.youtube.com/watch?v=hUi0eFuTi-g), so you can get a feel for it.

In all these games, two players face off, each coming to the game with their own deck of cards that
they have constructed (or selected) in advance. They draw cards from their decks into their hands
(that the opponent can't see), and play cards from their hands into play (or "into the
battlefield"). Typically, some of these cards are creatures which can attack the opponent's creature
or the opponent's health points directly. It's common for players to have health points, and for
them to lose when their health points reach 0.

## Gameplay

I like to say that the game is currently "gameplay-less". Obviously there is stuff happening, but
it's super basic, and not particularly fun.

The current goal is to put out a **tech demo** that showcases the 0xFable team's commitment and
ability to deliver something that works, with the goal of soliciting grants to fund further work on
the game, as well as the development and open-sourcing of the necessary building blocks.

Okay, but what **is** currently happening in a game between player A and player B?

In the tech demo, cards have no cost, and there are only creatures. Each creature has an attack
score and a defense score.

A player (say A) creates the game. Two players can subsequently join the game. In general, this will
include the game creator (A), though this is currently not constrained in the contracts — it could
be useful to let a third party create games, e.g., for tournaments. Nevertheless, the UI currently
assumes the game creator is a player that will join the game.

Once both players have joined the game, it starts automatically (currently the first joining player
goes first, this can be changed in the future). As part of joining, each player has drawn an initial
hand of cards, which will be rendered on the UI.

Let's assume player A goes first. Here is how A's turn goes:

- A can play a single card if he wants
- A can attack with any number of creatures, if able — attacking simply consists of selecting
  attacking creatures
- A can also pass if he doesn't want to attack (or play a card)

In summary, the possible sequences of actions for A in the first turn are:

- pass
- play card, then pass
- play card, then attack
- attack

Then it is B's turn. If A has attacked, B must defend. Defending consists of selecting up to a
defending creature for each attacking creature. So the "payload" of a defense is a (possibly empty)
set of pairs, where each pair consists of an attacking creature and a defending creature.

After defending, B draws a card, and then his turn proceeds like A's turn.

So the possible sequence of actions for B's turns (and for every single turn throughout the game):

- defend (if other player attacked), then draw, then pass
- defend (if other player attacked), then draw, then play card, then pass
- defend (if other player attacked), then draw, then play card, then attack
- defend (if other player attacked), then draw, then attack

Combat is resolved as follows:

- If an attacking creature is blocked, if the attacking creature's attack is higher than the
  defending creature's defense, the defending creature dies.
  - And vice versa, if the defending creature's attack is higher than the attacking creature's
    defense, the attacking creature dies.
  - So the creatures can kill each other.
- If an attacking creature is not blocked, it deals damage to the opponent's health points equal to
  its attack score.
- When a creature dies, it is placed into the player's graveyard (and currently, it just stays there
  until the end of the game).

The game ends when one of the players has no health points left.

And that's all there is to the tech demo's "gameplay".

## Game Components

You can get a pretty good idea of the game's very high-level architecture by looking at the
`packages` directory:

- `circuits` — zero-knowledge circuits
- `contracts` — Solidity contracts
- `webapp` — the web frontend / game client
- `e2e` — end-to-end UI frontend tests

Obviously, `e2e` are tests are thus not a game component.

From a strict perspective, there are only two components at this level: the frontend (a web
application) and the backend (game contracts living on the blockchain).

The zero-knowledge circuits are neatly divided between frontend and backend. Compiling a circuit
creates both a prover (Webassembly code) that is used by the frontend to generate zero-knowledge
proofs from private information, and a verifier (Solidity code) that is used by the backend to
verify the proofs submitted by players.

But more pragmatically, there are three areas of expertise: some people will be more knowledgeable
about frontend development, some about contract development, and some about circuits development.

Let's dive into each of these areas, starting with the contracts because that's where the heart of
the game lives.

## Contracts

### Cards and Inventory

Cards are NFTs, whose contract is `CardsCollection.sol`. Nothing special going on there and this is
mostly a placeholder.

One problem we have with NFTs used in games is that the ownership of the NFT could change at any
given time. One simple solution is to prevent card transfers while a game is ongoing. This works,
but can lead to less than optimal UX: it could seem that a card can be bought on a third-party
marketplace like OpenSea, but the purchase would fail because the card is currently used in a game.

An alternative solution that we have implemented is to require players to stake their cards in a
special contract in order to use them in a game. This special contract is `Inventory.sol`. Whenever
a player transfers a card to the inventory, a "ghost" version of the card is minted in
`InventoryCardsCollection.sol`. This enables the UI (and other contracts / frontends) to use the
usual NFT tools to determine the cards a player owns (which comprises both its regular cards and the
cards staked in the inventory).

The inventory contract does not allow players to stake/unstake cards to/from the inventory while
they are participating in a game. (TODO: This is not implemented yet!)

Beyond solving this issue, the inventory contract also manages deck listings. Players can use any
card they own to create a deck that can be used in a game. The same card can be used in multiple
decks.

This leads to a janky issue: what if a player uses an inventory card in a deck, and then removes the
card from his inventory? We must either check all decks when that happens (or maintain a mapping
from card the decks they are used in), or check a player's deck before every game. Currently, we do
the latter, but we might want to revisit this decision.

It's also certain that there will be other deck validity conditions. For instance, we will limit the
number of copies of the same card that can appear in a deck, for instance to 3. A unique card
(unique NFT ID) can of course not appear multiple times in a deck. We might also adopt something
like [Gwent's provision system](https://www.playgwent.com/en/news/41252/gwents-design-01-provision)
which puts constraints on deck building for the sake of promoting diversity of card use.

### `Game.sol`

The core of the game, however, lives in `Game.sol`. If you read the description of the current
gameplay in the last section, you probably won't be surprised by the content of this file. But let's
call attention to some implementation details.

First, a few data structures:

- `GameData` — there is one such struct per game (i.e. match) and it encapsulates the entirety of the
  (public) data necessary to play the game. Almost all functions in `Game.sol` take a `gameID`
  uniquely identifying a game, and the first thing done is to fetch this structure.

- `PlayerData` — there is one such struct per player per game. It's stored inside a mapping in
  `GameData`. We could have "inlined" this inside `GameData` but I sort of attempted to make it as
  easy as possible to extend to contracts to support more than two players.

- `FetchedGameData` — this structure is meant to be read by clients and is basically `GameData` with
  the `PlayerData` flattened inside it (Solidity can't return mappings because it does not know the
  set of keys).

Within the game data, `currentPlayer` identifies the player who has to take action, while
`currentStep` (whose type is the enum `GameStep`) constrains the kind of actions that can be taken.

The game steps are: `DRAW`, `PLAY`, `ATTACK`, `DEFEND`, `PASS`. They have a double duty of both
marking an expected step, and representing the action the user makes.

Note that there isn't a perfect 1-1 mapping between these two things. When the `currentStep` is
`PLAY`, it merely means that the player is able to play a card, but at that stage, `ATTACK` and
`PASS` are both valid actions for the player to take, respectively bypassing the option to play a
card and both the option to play a card and attack. (Refer to the section on gameplay for details.)

Transition the `currentPlayer` and `currentStep` is done via the `step` modifier. This modifier is
applied to every function that represents a game action. It must be given the step that the player
tries to take. The modifier then checks that the step is valid given `currentStep` and
`currentPlayer`, returns to the function, then transitions the game state to the next step, which
may depend on the action the current player picked. For instance, the next step might be `DEFEND` or
`DRAW`, depending on whether the current player attacked or passed.

Another detail: there used to be a predicate (`joinCheck`) to verify if a player is allowed to join
a game. This would let the creator of the game restrict who can join by specifying a (pre-supplied
or custom) function, for instance, this enables password-protected games, or games only for friends,
or players within a certain ranking range. I ran into trouble encoding this on the fronted, so I
removed it for now (meaning anyone can join any game), but it needs to go back in.

Let's take a step back from pure Solidity to tackle two more abstract concepts: randomness & private
information.

## Randomness

Players need to draw cards from their decks. These cards need to be random. To derive randomness, we
use blockhashes. The idea is as follows: every action in the game updates the `lastBlockNum` field
in the game data with the latest block number. The next action that requires randomness will then
use the blockhash of the block with the given number as a random value.

Is that value truly random? Well, the block producer can "reroll" it as often as they like. So if
the block producer colludes with a player, they can iterate on the blockhash (by adding a bogus
transaction and iterating the gas limit) until they find a random number that will advantage the
player.

If you assume that the block producer is impartial, then this works as long as there are enough
transactions on the chain that a player may not be able to guess what the blockhash would be. On
blockchains that have something like Ethereum's PREVRANDAO, this is an even better solution. It's
probably a good thing to implement inside a custom rollup implementation.

(Side note: verifiable randomness (VRF) oracles are another solutions, but they're only really
practical insofar that they don't add latency to the game, which is the case because the work via
request & response, and so require to wait for one extra block.)

Note that "randomness" is not the only important property here. We also need (1) to ensure players
can't predict randomness multiple actions in advance (which would let them know in advance every
card they'll draw in the game!) and (2) other players can't know the randomness of another player
(because then they could infer which cards that player has drawn — more explanations on this later).

The above scheme gives us property (1), because the randomness is derived from the blockhash, which
we assume cannot be known in advance. We, however, do not have property (2), because the opponent can
see the blockhash as well as we can.

The fix is easy however: at the start of the game, every player picks a value, and they commit to it
on-chain (by sending its hash). Thereafter, anytime a player needs a private random value, they
simply mix the blockhash with the value they committed to. Verifying that the correct value was used
can be done easily inside a zero-knowledge proof: the hash of the value is a public input, and the
value is a private input, the proof verifies `hashFunc(value) == hash`.

TODO: we haven't implemented the above commitment to a value yet

## Private Information

In the game, players' hands are hidden from other players. This is made possible by the "private
random values" explained in the previous section, which allows us to privately draw cards from our
deck in a way that is verifiable, without revealing the cards to the opponent.

What's missing is a way to "commit" to the cards we drew. For this, we can create a [Merkle
tree](https://en.wikipedia.org/wiki/Merkle_tree) where the cards in our hand are the roots of the
tree. We can then commit to the Merkle root on-chain.

This is not yet perfect: the opponent could "brute force" the Merkle root by trying to Merkleize
every single possible hand (for a 5-cards hand drawn from a 60-cards, that's very tractable [5.5
million possibilities](https://norswap.com/combinatorics/)), and therefore still figure out which
cards we drew.

Simple fix: mix the Merkle root with our secret value (the same we used for randomness).

TODO: we haven't implemented this mixing yet either

But why post the Merkle root on chain in the first place? These are necessary to verify our
zero-knowledge proofs. In particular, our current system contains three zero-knowledge proofs:

1. proof of drawing the initial hand
2. proof of drawing an additional card
3. proof of playing a card from your hand.

To prove we played something from our hand, the chain needs to have some notion of what our hand is!
This is why we need something derived from the cards in the hand: in this case the mixed Merkle
root.

What proof 1 and 2 do then, is prove that we are correctly updating this value. Proof 1 by setting
its initial value, and proof 2 by proving that we are drawing the correct random card, adding it to
Merkle tree, and providing the correct mixed Merkle root to the contracts for this new Merkle tree.

But the hand is not the only Merkle root we need to maintain. We also need to maintain a Merkle root
for our deck!

The reason has to do with how cards are drawn. Say my  random value is `r`. I will add the card
`deck[r % deck.length]` to my hand. But now this cards has left my deck and cannot be drawn again!
We enforce this by modifying the deck: we set `deck[r % deck.length] = deck.last` and then delete
`deck.last` the last item of the deck. Next time, we can use the same method but with a shorter
`deck.length` to draw a new card.

Same as before, to prove we did this correctly, the contract needs to have a commitment to our
current deck, and the opponent cannot know the cards left in the deck (or he would know exactly what
we drew). Therefore, we need another Merkle tree.

In the contracts, the Merkle roots are represented by the `handRoot` and `deckRoot` fields in the
player data.

In fact, all three proofs must show a correct update of some root(s). For proof 3 (playing a card),
we are taking a card out of our hand and so must update that root accordingly!

Also note that proof 1 creates the commitments, but we can know that these are correct because the
initial deck listing of every player is public information.

(In the future, we might want secret deck listings. Then we could replace those with commitments,
though we would also need new zero-knowledge proofs to show that a deck satisfies all the constraints
the game imposes on them.)

Confused? Here's [another explanation](https://twitter.com/norswap/status/1590489878726205440) I
wrote a while ago that might help you. You won't find any other explanation, because as far as I
know nobody else has done something like this?

There is, however, at least another method to achieve the same result, which is known as "mental
poker". There are clear advantages, but also some drawbacks (mostly, more
code/complexity/infrastructure) to that method, I've written about it [in this
issue](https://github.com/norswap/0xFable/issues/42).

## Zero-Knowledge Circuits

The circuits are written using Circom. The three proofs outlined in the previous section are
respectively implemented by the circuit files:

1. `DrawHand.circom`
2. `Draw.circom`
3. `Play.circom`

If you want to get more familiar with Circom, I highly recommend [this Circom course from
0xParc](http://learn.0xparc.org/circom/).

You may also notice the `Draw6`, `Initial67`, and `Play4` circuits. These take the circuits template
defined in the above file and instantiate them as circuits with concrete parameters. In particular,
they set an initial hand size, as well as maximum hand and deck sizes (7 cards in the initial hand,
16 cards max for the hand, 64 cards max for the deck currently).

!! The circuits are still undergoing some development at the moment.

When compiling each circuit, Circom generates a prover (WebAssembly code, used in the frontend) and
a verifier (Solidity code, used in the contracts).

So for instance, when you draw a card, you will call the `drawCard` function from `Game.sol` and
pass it the new hand root, the new deck root, and the proof. The contract will call the
`DrawVerifier.sol` contract generated by Circom to verify the proof, and if it checks out, it will
update the hand and deck roots.

Incidentally, this means that if the zero-knowledge circuits are under development, or broken, or we
don't generate the proofs yet, we can still test the game by just bypassing the proof verification.
That's exactly what we do at the time of writing!

Let's dive into each of the three circuits work. [This will need to change
soon](https://github.com/norswap/0xFable/issues/50) because this current approach is not practical
(the proving time is too high and the "proving key" that needs to be imported by the client is much
too big).

### `DrawHand.circom`

This circuit starts by computing the randomness from the private random value (which must be
verified against the on-chain commitment) and the public randomness.

Then, for every card we will draw, we select a random index to pick (which is `randomness %
remainingDeckSize`). We then update the deck by swapping the card at that index with the last card
in the deck, we also collect all the cards we drew.

Doing this in Circom is more involved than it seems because it's not possible to index an array with
an integer that isn't known at compile time. As a result, the fully general approach to index an
array (unless some kind of trick can be used for the specific case) is to iterate the whole array
and compare the loop variable to the index we want to access. You can see this done in the
`RemoveIndex` template.

In fact, that template is incorrect, because we use the lastIndex as a compile-time constant, but
this will only work for deck that have the max size of 64. For smaller decks, the results will not
be correct. Fixing this would require two iterations over the array instead of one: one to access
the index to be removed, and one to access the last index.

Once we've drawn all the cards, we simply check that the resulting deck and hand's Merkle roots
match those that we provided to the proof.

Doing this really kills our proof performance, as it requires doing ~128 hashes, which generate a
lot of constraints, even when using zk-friendly hash function (we use MiMCSponge, which in our tests
with the circomlib implementation and the Circom Plonk backend is a faster than Poseidon, another
such hash function). When we rewrite the circuits, we will instead hash all the cards in a single
hashing operation. We can further minimize the operations to be done by packing the cards in a small
number of field elements ("signals"), since every card is a number betweeen 0 and 255.

Also note that we currently don't salt the Merkle roots (in any contract) but we need to do so in
the future, otherwise it will be possible for opponents to brute force the hashes to figure out what
we drew.

### `Draw.circom`

This circuit is responsible for drawing a single card. (Note that we could iterate this logic to
implement `DrawHand`, but the resulting circuit would be much larger than the one we have now.)

It takes as public inputs the old and new deck and hand Merkle roots.

As private inputs, it takes Merkle proofs for:
- the card drawn in the deck
- the last card in the deck
- the last card in the hand
- the new card added to the hand (relative to the new hand root)

These "proofs" are "Merkle branches". If you consider the path from a leaf to the root in a *binary*
Merkle tree, they are all the siblings of the nodes on that path. Given such a path and the leaf,
you can recompute the root. Obtaining the root passed in means the proof checks out.

It then uses the value in the Merkle proofs to verify that the new roots are correct transformations
of the old roots.

One thing that this circuit needs to do, but doesn't curently, is derive the random index to draw
from. This should be done in exactly the same way as in the `DrawHand` proof.

### `Play.circom`

This proof is very similar to the draw proof, except it doesn't involve the deck.

It proves the correct transition from the old hand root to the new hand root, proving that the card
we are playing was indeed in the hand, and that we correctly updated the hand to remove the card (by
swapping it with the last card in the hand, and reducing the size of the hand by one).

Again, this should normally derive the random index.

## Frontend

Our frontend stack comprises Typescript, React, Jotai (atom-based state management), Next.js and
Tailwind CSS for the UI, as well as Wagmi, Viem (an ethers.js / web3.js alternative by the Wagmi
team) and Web3Modal for blockchain interaction.

We're investigating changing many parts of that stack:

- [using Vite instead of Next (for better source maps)](https://github.com/norswap/0xFable/issues/43)
- [using Solid.js instead of React](https://github.com/norswap/0xFable/issues/13) (very speculative,
  probably only if a Solid.js fan pops up to help)
- [using MUD](https://github.com/norswap/0xFable/issues/29) — a full stack web3 framework that
  simplifies syncing the frontend with the blockchain
- [using ConnectKit instead of Web3Modal for wallet interaction](https://github.com/norswap/0xFable/issues/18)

(Crucially no decisions have been arrested on any of those things.)

### Store Structure

Beyond the stack, the most important thing to understand in the frontend is how blockchain
interaction is structured. This mostly happens in the `store` module, which is structured as
follows:

- `atoms.ts` — This defines the atoms that actually store the state. These atoms *should not* be
  read direclty from React, instead hooks from `hooks.ts` should be used.
- `hooks.ts` — React hooks that abstract over the atoms in `atom.ts`. Having this layer helps keeps
  things clean and will make it easier to migrate to another state management library later if
  needed.
- `network.ts` — Defines functions to fetch blockchain data, taking care of various things such as
  retries, throttling, filtering zombies (i.e., a request completing after a more recent one
  completed for the same data) and error-handling (todo!). These functions are used by `update.ts`
  and `actions.ts`.
- `actions.ts` — Actions that can be called from the frontend to perform a mix of blockchain
  interaction and local state updates. (See important notes about this below.)
- `update.ts` — Responsible to refresh/synchronize the local state with the blockchain state. (See
  important notes about this below.)
- `subscriptions.ts` — Manages event subscriptions. Currently, we simply use them to trigger an
  update to the game data via `update.ts`.

### State Synchronization

An important insight in understanding the relationship between frontend and blockchain is that the
goal is to keep the frontend synchronized to the chain, which is the source of truth.

The absolute simplest way to do that is to use a pure derivation: fetch all the game data from
the chain, and re-derive the local state from it. And that's exactly what we do right now.

The whole game state (minus the private parts, which we need to preciously conserve locally) can be
fetched by calling the `fetchGameState` view function from `Game.sol`.

This is the main role of `update.ts`: ensure all the atoms are updated correctly with respect to
this data.

But `update.ts` also ensures we do not end in mixed or abherrant state. For instance, it resets the
state if we switch the wallet address or the blockchain network. The key mandate is that at any time
that the state can be read (e.g. by React hooks) or written (e.g. by actions), the state presented
should be fully consistent.

In the future, we will introduce "optimistic updates", where we update the local state before having
had confirmation that the state changed on the blockchain. This helps make the game feel more
snappy, but must be handled carefully.

These optimistic updates can be triggered once the player initiates an action, or when we receive an
event from our chain subscriptions (normally we'd have to wait an extra roundtrip to the blockchain
to fetch the new state in both of these cases).

### Actions and Chain Interaction

The `actions.ts` is meant to represent user actions that change the state. These actions will be of
two natures:

1. change the local state
2. change the blockchain state (reflected locally)

The first action mostly has to do with private data: for instance drawing our initial hand is an
action that modifies the local state, but not the blockchain state — because the hand is private.

Of course, we'll need to commit to the hand on-chain, but that can be considered as a separate
action. The key idea here is that the drawn hand cannot be derived from on-chain data via
`update.ts`.

The second kind of action basically calls an on-chain function, and its completion will trigger an
update via `update.ts`. Currently, these are not implement in `action.ts` at all, but instead rely
on wagmi hooks wrapped in custom logic implemented in `hooks/useChainWrite.ts` and
`hooks/useFableWrite.ts`.

I'm not sure these things should be managed as hooks at all, so they might move to `actions.ts` in
the future.

Wagmi is very convenient, but it's hard to understand the intricacies of what it does. Understanding
its behaviour with respect to React and blockchain interaction (retries? timeouts? caching?)
requires to understand tanstack-query (a library used by Wagmi) and how Wagmi configures it (which
is not documented, you need to read the code). I think it's possible to build a simpler and more
transparent abstraction instead and diminish our dependencies on Wagmi.
