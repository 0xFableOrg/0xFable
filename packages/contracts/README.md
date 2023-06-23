# 0xFable Contracts

## Installation

Tooling required:

- [Foundry](https://github.com/gakonst/foundry)
- Make
- Node.js & [PNPM](https://pnpm.io/) (`npm install -g pnpm`)

## Configuration

Run `make setup` and customize `.env` if necessary.

By default:
- `PRIVATE_KEY_LOCAL` is set the to the first Anvil devnet account (seeded by ETH)

## Makefile Commands

### Lifecycle

- `cd ../.. && make setup` - initialize libraries and npm packages
- `make setup` - sets up symlinks & copies `.env.example` to `.env` if `.env` does not exist
- `make build` - build your project
- `make watch` - watch files and re-run tests on temp local devnet
- `make clean` - remove compiled files

### Testing

- `make test` - run tests on temp local devnet
- `make test-gas` - run tests and show gas report on temp local devnet
- `make test-fork` - run tests and show gas report using `$ETH_NODE` as RPC endpoint

### Code Quality

- `make lint` - lint files (look for code smells)
- `make format-check`- checks that the code is properly formatted, but does not modify it
- `make format` - formats code
- `make check` - runs `make lint` and `make format-check`

### Deployment

- `make anvil` - run local Anvil devnet on port 1337
- `make deploy` - deploy the contracts on the $RPC_$CONFIG, using `$PRIVATE_KEY_$CONFIG` as deployer
   private key, you can configure your own $CONFIG values, but we suggest `LOCAL`, `TEST` and `MAIN`
   for local devnet, testnet and mainnet respectively
    - the contract addresses are output to `out/deployment.json`
    - also updates the wagmi-generated bindings (in `packages/webapp/src/generated.ts`)
- `make deploy-debug` prints more about what happens to deploy (only to local devnet)

### Misc

- `make selectors` - dumps to selectors for functions, events and errors to `out/selectors.txt`
- `make update-forge-std` - updates forge-std by git cloning it inside this repo (fuck git modules)