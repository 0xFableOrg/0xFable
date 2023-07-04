# ==================================================================================================
# BASICS COMMANDS
#   To get the project running locally.

# To be run when first setting up the repository.
setup: init-modules install-frozen
	cd packages/contracts && make setup
.PHONY: setup

# Runs the project locally via run-pty, which manages multiple background processes in a single
# terminal. This does not work in all terminal emulators, and might not be the most convenient
# option for you, so you can also run
dev:
	pnpm run-pty % make anvil % make webdev % make deploy % make circuits
.PHONY: dev

# Runs anvil (local EVM node).
anvil:
	cd packages/contracts && make anvil
.PHONY: anvil

# Runs the webapp in dev mode.
webdev:
	cd packages/webapp && make dev
.PHONY: webdev

# Deploys to the contracts to the local node (requires anvil to be running).
deploy:
	cd packages/contracts && make deploy
.PHONY: deploy

# Build the zero-knowledge circuits.
circuits:
	cd packages/circuits && make all
.PHONY: circuits

# Performs code-quality checks.
check:
	cd packages/contracts && make check
	cd packages/webapp && make check
.PHONY: check

# ==================================================================================================
# IMPLEMENTATION DETAILS

# NOTE: we don't have any submodules currently, they are best avoided.
init-modules:
	git submodule update --init --recursive
.PHONY: init-modules

# Install packages as specified in the pnpm-lockfile.yaml.
install-frozen:
	pnpm install --frozen-lockfile
.PHONY: install-deps

# ==================================================================================================
# DEPENDENCY MANAGEMENT
#   Update dependencies, check for outdated dependencies, etc.

# NOTES:
#  Below "version specifier" refers to the version strings (e.g. "^1.2.3") in package.json.
#  You can safely use pnpm commands inside the packages, and things will behave like your expect
#  (i.e. update only the package, but use the pnpm monorepo architecture).

# Like npm install: if a version matching version specifier is installed, does nothing, otherwise
# install the most up-to-date version matching the specifier.
install:
	pnpm install -r
	@echo "If the lockfileVersion changed, please update 'packageManager' in package.json!"
.PHONY: install

# Shows packages for which new versions are available (compared to the installed version).
# This will also show new version that do not match the version specifiers!
outdated:
	pnpm outdated -r
.PHONY: outdated

# Updates all packages to their latest version that match the version specifier.
# It will also update the version specifiers to point to the new version.
# You can also run this if your installed versions are > than the version specifiers and you want
# to update them.
update:
	pnpm update -r
	@echo "If the lockfileVersion changed, please update 'packageManager' in package.json!"
.PHONY: update

# Updates all packages to their latest version (even if they do not match the version specifier!).
# It will also update the version specifiers to point to the new version.
update-deps-latest:
	pnpm update -r --latest
	@echo "If the lockfileVersion changed, please update 'packageManager' in package.json!"
.PHONY: update-deps-latest

# In case you accidentally pollute the node_modules directories
# (e.g. by running npm instead of pnpm)
reset-modules:
	rm -rf node_modules packages/*/node_modules
	pnpm install --frozen-lockfile
.PHONY: reset-modules

# ==================================================================================================