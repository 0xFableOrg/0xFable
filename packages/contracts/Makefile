# include .env file and export its env vars
# (-include to ignore error if it does not exist)
-include .env

# Set CONFIG to "LOCAL" by default. Other valid values: "TEST" or "MAIN".
CONFIG?=LOCAL
export CONFIG

# See README.md for documentation.

# The reason for this weird setup is that the IntelliJ solidity plugin will not resolve imports
# if they're not in `lib` and do not have a `src` directory (the `remappings.txt` file is ignored).
setup:
	if [ ! -f .env ]; then cp .env.example .env; fi
	ln -sf ../node_modules/forge-std lib/forge-std
	mkdir -p lib/openzeppelin
	ln -sf ../../node_modules/@openzeppelin/contracts lib/openzeppelin/src
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

check: lint format-check
.PHONY: check

format-check:
	forge fmt --check src/*.sol src/test/*.sol src/deploy/*.sol
.PHONY: format-check

lint:
	pnpm solhint --config ./.solhint.json "src/*.sol" "src/test/*.sol" "src/deploy/*.sol"
.PHONY: lint

format:
	forge fmt src/*.sol src/test/*.sol src/deploy/*.sol
.PHONY: format

# The 1337 chain id matches chain.localhost in RainbowKit & "Localhost 8545" in MetaMask.
anvil:
	anvil --chain-id 1337 --code-size-limit 30000 --block-time 2
.PHONY: anvil

# Dumps function, event and error selectors to out/selectors.txt
selectors:
	forge upload-selectors --all > out/selectors.txt
.PHONY: selectors

# Deploys locally, to testnet or mainnet depending on the $CONFIG value (locally if not set).
deploy: build
	@forge script src/deploy/Deploy.s.sol:Deploy \
		--fork-url $(RPC_$(CONFIG)) \
		--private-key $(PRIVATE_KEY_$(CONFIG)) \
		--broadcast \
		--non-interactive \
		| grep "address " > out/deployment.txt
	@cat out/deployment.txt
	@node scripts/extract_contract_addresses_abis.js \
		out/deployment.txt \
		out/abis.json \
		> out/deployment.json
	@cd ../webapp && pnpm wagmi generate
.PHONY: deploy

# Sometimes the deployment crashes, this allows us to see why. Hardcoded to only use local
# deployment.
debug-deploy:
	forge script src/deploy/Deploy.s.sol:Deploy \
		--fork-url http://localhost:8545 \
		--private-key $(PRIVATE_KEY_LOCAL) \
		--broadcast
.PHONY: debug-deploy

# My hatred for git modules runs so deep, I'm straight up vendoring all of forge-std.
update-forge-std:
	rm -rf lib/forge-std
	cd lib && git clone git@github.com:foundry-rs/forge-std.git
	cd lib/forge-std && git submodule update --init --recursive
.PHONY: update-forge-std