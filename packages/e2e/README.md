# End To End Testing

Using [Playwright](https://playwright.dev/) & [Synpress](https://github.com/Synthetixio/synpress),
see [Makefile](Makefile) for commands. Prefix any command with `HEADLESS=false` to display the
browser window while the tests are running.

The local chain + app must be running (and the contracts must have been deployed) for the tests to
proceed (`make dev` in top-level Makefile).

To record a test by clicking in the user window, include `await shardPage.pause()` in the tests, at
the point where wish to record. Then run the tests **with HEADLESS=false**. The inspector window
will pop, letting you record test actions.

Alternatively, consider using [dappeteer](https://github.com/ChainSafe/dappeteer).

Usually testing with `make chrome` is enough, but please run `make all-browsers` before submitting
your pull request.