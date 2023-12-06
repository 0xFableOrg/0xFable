# 0xFable

See also the README files of the various subpackages:

- [contracts](packages/contracts/README.md)
- [webapp](packages/webapp/README.md)
- [circuits](packages/circuits/README.md)

## Installation

1. Install pre-requisite tooling:
   - Make
   - [Foundry](https://github.com/foundry-rs/foundry)
     - Last `foundryup`: 16 May 2023
   - Node.js & [PNPM](https://pnpm.io/) (`npm install -g pnpm`)
     - Tested with Node v20.1.0
     - The appropriate pnpm version is listed under the "packageManager key in [`package.json`](./package.json)
     - If you have any issues while installing dependencies with pnpm you can try to use `corepack` to make sure you use the correct version of pnpm.
       - `corepack enable`
       - `corepack pnpm install`
   - [Circom](https://docs.circom.io/getting-started/installation/)
     - Needed to build circuits package
     - Tested with version 2.1.4
2. **Run `make setup`**
3. Run contract tests for basic sanity testing:
   - `(cd packages/contracts && make test)`
4. [Install Circom](https://docs.circom.io/getting-started/installation/)

## IDEs

If you're using Visual Studio Code, the contract remappings will only be picked up if you set the
root of the project to the `contracts` package. Otherwise, you'll have to manually add the remappings
(from `remappings.txt`) to the Solidity plugin configuration.

## Running

To deploy and try out the app run the following commands (`anvil` and `webdev` will keep running and
must be run in their own terminal):

```shell
make anvil
make webdev
make deploy
make circuits
```

This will do the following:

- Run anvil (local EVM node) at localhost:8545 with chain ID 1337
  (this chain comes preconfigured in Metamask and other wallets as "Localhost")
- Run the NextJS dev command (web server + live reload)
- Deploy the contracts to the local node
- Build the zk circuits (the first time, you will need to a 300MB trusted setup file). Make sure you
  have [circom](https://docs.circom.io/getting-started/installation/) installed.

After that, you can visit the app at http://localhost:3000/ (if that port is already occupied,
NextJS might affect another one).

**Common caveat**: Every time you restart Anvil, you might have to perform some kind of reset in
your wallet. With Metamask, that's "..." > "Settings" > "Advanced" > "Clear activity and nonce
data".

## Testing The Game

If you access the app via http://localhost:3000/, you can interact with it with your wallet.
You'll need to "Claim Airdrop" in order to get a deck to play with.

However, for testing, it's expected you'll the Anvil ("test ... junk" mnemonic) accounts. These come
preloaded with local testnet ETH, and as part of our deploy script, we pre-airdrop a deck to
accounts 0 and 1.

You can import those accounts in your wallet, but we recommend instead accessing the app via:

- http://localhost:3000/?index=0
- http://localhost:3000/?index=1

**This will load the test private key locally, and avoid the need for you to click your wallet
every time a transaction is made!**

**IMPORTANT**: You will need to use two separate browsers (or two separate profiles) to test the
game with two different accounts. It may work to some extent with two different tabs, but any
reload will reset the address.

If you would like to skip proof generation and verification, you can replace `make deploy` and
`make dev` with the following commands:
- `cd packages/contracts && make deploy-noproofs`
- `cd packages/webapp && make dev-noproofs`

If you would like to test with deterministic randomness and avoid timeouts when a player takes too
long to perform an action, you can replace `make deploy` with:
- `cd packages/contracts && make deploy-norandom`

To both skip proofs and use deterministic randomness, you can replace `make deploy` and `make dev`
with the following commands:
- `cd packages/contracts && make deploy-noproofs`
- `cd packages/webapp && make dev-noproofs-norandom`

## Commands

See the [Makefile](/Makefile) for a description of all top-level make commands.
