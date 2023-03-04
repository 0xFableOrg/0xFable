setup:
	make init-modules
	make install-deps
.PHONY: setup

init-modules:
	git submodule update --init --recursive
.PHONY: init-modules

install-deps:
	pnpm install --frozen-lockfile
.PHONY: install-deps

outdated-deps:
	pnpm outdated -r
.PHONY: outdated-deps

update-deps:
	pnpm update
.PHONY: update-deps

# in case you accidentally pollute the node_modules directories
# (e.g. by running npm instead of pnpm)
reset-modules:
	rm -rf node_modules packages/*/node_modules
	pnpm install --frozen-lockfile
.PHONY: reset-modules

# only for maintainers
update-deps-latest:
	pnpm update -r --latest
.PHONY: update-deps-latest

generate-typechain:
	cd packages/webapp && pnpm typechain
.PHONY: generate-typechain

build:
	cd packages/contracts && make build
	cd packages/webapp && pnpm wagmi generate && pnpm build
.PHONY: build

