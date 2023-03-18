# Opprobrium

## Installation

Tooling required:

- Make
- [Foundry](https://github.com/foundry-rs/foundry)
  - Last `foundryup`: 18 March 2023
- Node.js & [PNPM](https://pnpm.io/) (`npm install -g pnpm`)
  - Tested with Node v16.16.0

Run contract tests:

- `(cd packages/contracts && make test)`

Make sure to check [`packages/contracts/README.md`][contracts] and
[`packages/webapp/README.md`][webapp].

[contracts]: packages/contracts/README.md
[webapp]: packages/webapp/README.md

To deploy and try out the app locally:

```shell
# background shell 1
(cd packages/contracts && make anvil)

# main shell
cd packages/contracts
cp .env.example .env # deployer key = first preloaded anvil account
make build # not necessary if you did make build at top level
make deploy-local
cd -

# background shell 2
(cd packages/webapp && make dev)
```

The app is now running on http://localhost:3000/

It needs to connect to the local chain, whose RPC URL is "http://localhost:8545" and chain ID 1337.
This chain comes preconfigured in Metamask and other wallets, as "Localhost".

Note: at least for me, Metamask has a bug that doesn't let the app initiate chain switching when
the target is "localhost" (other targets work fine). If the same thing happens to you, you'll need
to switch to the localhost chain manually within the wallet.

## Commands

See the [Makefile](/Makefile) for a description of all top-level make commands.