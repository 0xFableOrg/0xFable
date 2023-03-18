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

The app is now running on http://localhost:8080/

It needs to connect to the local chain, wwith RPC URL is "http://localhost:8545" and chain ID 1337.
This chain comes preconfigured in Metamask and other wallets, as "Localhost".

Note: because Metamask is bad, it breaks the feature that lets the app initiate chain switching,
so you will need to switch to "Localhost" yourself within the wallet.

## Commands

- `make setup` - initialize libraries and npm packages
- `make update-deps` - update node dependencies

## TODO

- .env.example > .env in webapp