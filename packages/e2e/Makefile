# NOTE: Using playwright commands — synpress commands use Cypress

URL?=http://localhost:3000

# Synpress: needed to share state between tests
export SERIAL_MODE?=true

HEADLESS?=true
ifeq ($(HEADLESS),true)
	# Synpress: HEADLESS_MODE defined means don't show the browser.
	export HEADLESS_MODE?=true
else
	HEADED=--headed
endif

# Only run test on Chrome
chrome:
	pnpm playwright test $(HEADED) --project=chromium
.PHONY: chrome

# Run tests on all browsers
all-browsers:
	pnpm playwright test $(HEADED)
.PHONY: playwright

# Use UI mode (potentially useful for debugging)
ui:
	HEADLESS_MODE=false pnpm playwright test $(HEADED) --ui
.PHONY: ui

# Show last generated report
report:
	pnpm playwright show-report
.PHONY: report