# Define NODE_ENV=prod to switch to prod mode.

export NODE_ENV ?= dev

serve:
	cd www && pnpx reload -b
.PHONY: serve

build:
	node esbuild.js
.PHONY: build

watch:
	node esbuild.js --watch
.PHONY: watch