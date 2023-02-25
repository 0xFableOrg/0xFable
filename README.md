# Opprobrium

## Installation

Tooling required:

- Make
- [Foundry](https://github.com/gakonst/foundry)
  - Test with forge v0.2.0, cast v0.2.0 & anvil v0.1.0
- Node.js & [PNPM](https://pnpm.io/) (`npm install -g pnpm`)
  - Tested with Node v16.16.0

Test that everything is working properly:

- `make build`
- `(cd packages/contracts && make test)`

Make sure to check [`packages/contracts/README.md`][contracts] and
[`packages/react/README.md`][react].

[contracts]: packages/contracts/README.md
[react]: packages/react/README.md

To deploy and try out the app locally:

```shell
# shell 0
(cd packages/contracts && make anvil)

# shell 1
(cd packages/react && make serve)

# shell 2 (optional)
(cd packages/react && make watch)

# main shell
(cd packages/contracts && make build)
(cd packages/contracts && make deploy-local)
(cd packages/react && make build) # optional, if not watching
```

The app is now running on http://localhost:8080/

It needs to connect to the local chain, wwith RPC URL is "http://localhost:8545" and chain ID 1337.
This chain comes preconfigured in Metamask and other wallets, as "Localhost".

Note: because Metamask is bad, it breaks the feature that lets the app initiate chain switching,
so you will need to switch to "Localhost" yourself within the wallet.

## Commands

- `make setup` - initialize libraries and npm packages
- `make update-deps` - update node dependencies
