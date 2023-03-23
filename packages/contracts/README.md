# 0xFable Contracts

## Installation

Tooling required:

- [Foundry](https://github.com/gakonst/foundry)
- Make
- Node.js & [PNPM](https://pnpm.io/) (`npm install -g pnpm`)

## Configuration

Copy `.env.example` to `.env` and customize if necessary.

By default:
- `PRIVATE_KEY0` is set the to the first Anvil devnet account (seeded by ETH)

## Commands

- `cd ../.. && make setup` - initialize libraries and npm packages
- `make build` - build your project
- `make test` - run tests on temp local devnet
- `make watch` - watch files and re-run tests on temp local devnet
- `make test-gas` - run tests and show gas report on temp local devnet
- `make test-fork` - run tests and show gas report using `$ETH_NODE` as RPC endpoint
- `make clean` - remove compiled files
- `make lint-check` - check that files are properly linted
- `make lint` - lint files
- `make anvil` - run local Anvil devnet on port 1337
- `make deploy-local` - deploy the contracts on the Anvil devnet, using `$PRIVATE_KEY0` as deployer private key
  - the contract addresses are output to `out/deployment.json`