build:
	pnpm wagmi generate
	pnpm next build
.PHONY: build

# Serve webapp in production environment (after building)
serve:
	pnpm next start
.PHONY: serve

# Serve webapp in dev environment (building not required)
dev:
	pnpm next dev
.PHONY: dev

# Runs linter (use make check instead which also checks typescript typing).
lint:
	pnpm next lint --max-warnings 0
.PHONY: lint

# Runs code quality checks.
check: lint build
.PHONY: check