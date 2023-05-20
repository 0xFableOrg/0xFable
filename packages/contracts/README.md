# 0xFable Contracts

## Installation

Tooling required:

- [Foundry](https://github.com/gakonst/foundry)
- Make
- Node.js & [PNPM](https://pnpm.io/) (`npm install -g pnpm`)

## Configuration

Copy `.env.example` to `.env` and customize if necessary.

By default:
- `PRIVATE_KEY_LOCAL` is set the to the first Anvil devnet account (seeded by ETH)

## Commands

- `cd ../.. && make setup` - initialize libraries and npm packages
- `make setup` - copies `.env.example` to `.env` if `.env` does not exist
- `make build` - build your project
- `make test` - run tests on temp local devnet
- `make watch` - watch files and re-run tests on temp local devnet
- `make test-gas` - run tests and show gas report on temp local devnet
- `make test-fork` - run tests and show gas report using `$ETH_NODE` as RPC endpoint
- `make clean` - remove compiled files
- `make lint-check` - check that files are properly linted
- `make lint` - lint files
- `make anvil` - run local Anvil devnet on port 1337
- `make deploy` - deploy the contracts on the $RPC_$CONFIG, using `$PRIVATE_KEY_$CONFIG` as deployer
   private key, you can configure your own $CONFIG values but we suggest `LOCAL`, `TEST` and `MAIN` for
   local devnet, testnet and mainnet respectively
  - the contract addresses are output to `out/deployment.json`
  - also updates the wagmi-generated bindings (in `packages/webapp/src/generated.ts`)
- `make deploy-debug` prints more about what happens to deploy (only to local devnet)
- `make selectors` - dumps to selectors for functions, events and errors to `out/selectors.txt`
- `make update-forge-std` - updates forge-std by git cloning it inside this repo (fuck git modules)