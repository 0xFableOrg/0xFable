# include .env file and export its env vars
# (-include to ignore error if it does not exist)
-include .env

# See README.md for documentation.

setup:
	[ ! -f .env ] && cp .env.example .env
.PHONY: setup

build:
	forge build
.PHONY: build

test:
	forge test -vv
.PHONY: test

testv:
	forge test -vvvv
.PHONY: testv

test-gas:
	forge test --gas-report
.PHONY: test-gas

watch:
	forge test --watch src/
.PHONY: watch

test-fork:
	forge test --gas-report --fork-url ${ETH_NODE}
.PHONY: test-fork

clean:
	forge clean
.PHONY: clean

# Solhint will run prettier (prettier plugin configured).
# It also reports more details about prettier violation than prettier itself.
lint-check:
	pnpm solhint --config ./.solhint.json "src/**/*.sol"
.PHONY: lint-check

lint:
	pnpm prettier --check "src/**/*.sol" --write
	pnpm solhint --config ./.solhint.json "src/**/*.sol" --fix
.PHONY: lint

# The 1337 chain id matches chain.localhost in RainbowKit & "Localhost 8545" in MetaMask.
anvil:
	anvil --chain-id 1337
.PHONY: anvil

# Dumps function, event and error selectors to out/selectors.txt
selectors:
	forge upload-selectors --all > out/selectors.txt
.PHONY: selectors

# TODO: handle different deployment targets (possibly via envs?)
deploy: build
	@forge script src/deploy/Deploy.s.sol:DeployLocal \
		--fork-url http://localhost:8545 \
		--private-key $(PRIVATE_KEY0) \
		--broadcast \
		| grep "address " > out/deployment.txt
	@cat out/deployment.txt
	@node scripts/extract_contract_addresses_abis.js \
		out/deployment.txt \
		out/abis.json \
		> out/deployment.json
	@cd ../webapp && pnpm wagmi generate
.PHONY: deploy