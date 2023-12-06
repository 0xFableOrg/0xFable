# Game Flow

A game (identified with a game ID) is a pretty complex state machine, this document explains it,
and how it can be observed contract-side and frontend-side.

Let's assume two players, A and B, where A is the game creator.

Note that the contracts allow for a third party to be the game creator, but the frontend assumes
that the game creator will be one of the two players.

## Table of Contents

- [Before the game starts](#before-the-game-starts)
    - [Contract-side](#contract-side)
        - [Checks](#checks)
    - [Frontend-side](#frontend-side)

## Before the game starts

- A sends `createGame` → the game is assigned a gameID.
- Both players concurrently join the game.
  - A sends `joinGame`
      - then A sends `drawInitialHand`
  - B sends `joinGame`
      - then B sends `drawInitialHand`
  - A can send `cancelGame` at any time before B sends `joinGame`.
  - Anyone (even 3rd parties) can send `timeout` if a player fails to send `drawInitialHand` within
    256 blocks of the last received transaction.
      - TODO: This is not good, should be within his own thing. 
- Once both `drawInitialHand` have been received, the game starts.

Note that it isn't possible to concede until the game starts, nor is it possible to cancel the game
after all `joinGame` transactions have been received. This needs to be fixed, as a non-joiner
can lock other players in place for 8 minutes right now.

### Contract-side

Below we review how each successful transaction (== "received transaction") affects the game state
and generates events.

- `createGame` causes the `GameData` (`gdata`) structure to be initialized.
    - The game creator specifies a number of players. The frontend assumes this to be 2.
        - This value is assigned to `gdata.playersLeftToJoin`.
    - The game creator is recorded in `gdata.gameCreator`.
    - `gdata.lastBlockNum` is set to the current block number.
        - This is used to check that `gdata` is not uninitialized but matches a game that has been
          created via `createGame`. Note that we could use `gdata.gameCreator` for this instead.
          It's otherwise not necessary.
    - `gdata.currentStep` is set to `GameStep.UNINITIALIZED`.
    - All other values are left zeroed/uninitialized.
    - \[EVENT\] The `GameCreated(gameID)` event is emitted.


- Whenever `joinGame` is received, the player is added to the `inGame` mapping.
    - He now can't shift cards in and out of his decks, create or join another game.
        - The contracts permit a player to create as many games as he wants as long as he
          doesn't join any.
    - Additionally, the player is added to the `players` array of the `GameData`.
    - `gdata.playersLeftToJoin` is reduced by 1.
    - `gdata.lastBlockNum` is set to the current block number.
        - This is not used for randomness (`pdata.joinBlockNum` is used for that), but it is useful
          to simplify the frontend code (TODO — actually make this unnecessary, OR explain why).
    - The player's deck cards are appended to `gdata.cards`.
    - The player's `PlayerData` (`pdata`) is created.
        - `pdata.health` is set to `STARTING_HEALTH`.
        - `pdata.saltHash` is set to the supplied value.
        - `pdata.joinBlockNum` is set to the current block number.
        - `pdata.deckStart` and `pdata.deckEnd` are set to the start and exclusive-end indexes of
           the player's deck in `gdata.cards`.
    - \[EVENT\] The `PlayerJoined(gameID, playerAddress)` event is emitted.
    - \[EVENT\] If all players have joined, the `FullHouse(gameID)` event is emitted.
        - Corresponding to `gdata.playersLeftToJoin == 0`.


- Whenever `drawInitialHand` is received
    - `pdata.handRoot` and `pdata.deckRoot` are set to the supplied values.
    - `pdata.handSize` is set to `INITIAL_HAND_SIZE`.
    - The player (represented by his index into `gdata.players`) is added `gdata.livePlayers`.
    - \[EVENT\] The `PlayerDrewHand(gameID, playerAddress)` event is emitted.
    - \[EVENT\] If all players have drawn their hand, the `GameStarted(gameID)` event is emitted.
        - Corresponding to `gdata.playersLeftToJoin == 0 &&
          gdata.players.length == gdata.livePlayers.length`. 
        - `gdata.currentPlayer` is set to a random index into `gdata.players`.
            - TODO: change the way this randomness is selected
        - `gdata.currentStep` is set to `GameStep.PLAY`.
            - It is now the current player's turn to play a card (the first player does not draw on
              his first turn).


- Whenever `cancelGame` is received
    - \[EVENT\] The `GameCancelled(gameID)` event is emitted.
    - The game ends (see dedicated bullet).


- Whenever `timeout` is received
    - (only before the game starts: `gdata.currentStep == GameStep.UNINITIALIZED`)
    - \[EVENT\] The `MissingPlayers(gameID)` event is emitted.
    - The game ends (see dedicated bullet).


- Whenever the game ends
    - `gdata.currentStep` is set to `GameStep.ENDED`.
    - Data may be cleared to reduce storage costs. What is safe to read:
        - `gdata.currentStep`
        - `gdata.lastBlockNum`
    - All players that are still in the game are removed from `inGame`.

Let's now see how some of these values are used to perform contract-side checks

- #### Checks:
    - `inGame` is used to check that a player is not already in a game. 
    - `gdata.lastBlockNum` is used to check that a gameID exists, i.e. the matching `gdata` is not
      uninitialized but matches a game that has been created via `createGame`. It is also used to
      check for timeouts.
    - `gdata.players` is used to check whether a player already joined the game.
    - `gdata.livePlayers` is used to check whether a player has already drawn his hand.
    - `gdata.playersLeftToJoin` is used to check if the game has still space to join, or whether the
      game can still be cancelled.
    - In combination, `gdata.playersLeftToJoin == 0 && gdata.players.length ==
      gdata.livePlayers.length` is used to check whether the game can start.
    - `gdata.currentStep` is used to check whether the game already started / ended.
    - `pdata.joinBlockNum` being non-zero is used to check whether a player has already joined the
      game or not.
    - `pdata.handRoot` being non-zero is used to check whether a player has already drawn
      his hand or not.
    - `gdata.gameCreator` is used to check whether a player is the game creator.

### Frontend-side

The frontend synchronizes with the chain by periodically pulling the whole `GameData` from the chain
(including all `PlayerData`).

From this, it extracts a player-specific `GameStatus`, which is one of:

- UNKNOWN
    - Default value, for when we have no `gdata` yet.
- CREATED
    - The game has been created, but `joinGame` hasn't been received yet.
    - `gdata.currentStep == GameStep.UNINITIALIZED` and `gdata.players` does not include the player.
- JOINED
    - The player's `joinGame` has been received, but not `drawInitialHand`.
    - `gdata.currentStep == GameStep.UNINITIALIZED`, `gdata.players` includes the player, but
      `gdata.livePlayers` does not.
- HAND_DRAWN
    - The player's `drawInitialHand` has been received, but the game hasn't started.
    - `gdata.currentStep == GameStep.UNINITIALIZED` and `gdata.livePlayers` includes the player.
- STARTED
    - The game is ongoing. 
    - `GameStep.UNINITIALIZED <  gdata.currentStep < GameStep.ENDED`
- ENDED
    - The game has ended (could be cancellation, timeout, or only one player left standing).
    - `gdata.currentStep == GameStep.ENDED`

Additionally, the frontend derives the following boolean properties:

- `isGameCreator`
    - `gdata.gameCreator == playerAddress`
- `isGameJoiner`
    - `gdata.players` includes the player, but `gdata.gameCreator != playerAddress`
- `allPlayersJoined`
    - After all `joinGame` have been received, at which point the game can't be cancelled by the
      creator anymore.
    - `gdata.playersLeftToJoin == 0`

## TODO

- How are the various frontend pages driven by these values?
- Capture the state values that are not derived from the game data and the impact they have.
