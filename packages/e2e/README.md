# End To End Testing

Using [Playwright](https://playwright.dev/) & [Synpress](https://github.com/Synthetixio/synpress),
see [Makefile](Makefile) for commands. Prefix any command with `HEADLESS=false` to display the
browser window while the tests are running.

The local chain + app must be running (and the contracts must have been deployed) for the tests to
proceed (`make anvil`, `make deploy` and `make dev` in the top-level Makefile).

You might have to change the `PROOF_TIME` constant in `./tests/specs/create.spec.ts` to a
larger value. The current value is 25s which is a little above the time it takes to generate the
proof on Firefox on a beefy M1 Macbook Pro (Chrome is usually faster).

Note that if the tests fail midway through, it will be necessary to redeploy the contracts in order
to rerun the tests.

TODO: Write a cleanup script that cleans up to on-chain state to avoid this.

Usually testing with `make chrome` is enough, but please run `make all-browsers` before submitting
your pull request.

To avoid the overhead of proof generation, you can prefix `NO_PROOFS=1` in front of the `make`
command, which will make the e2e tests with `make deploy-noproofs` and `make dev-noproofs`

## Writing New Tests

To record a test by clicking in the user window, include `await sharedPage.pause()` in the tests, at
the point where wish to record. Then run the tests **with HEADLESS=false**. The inspector window
will pop, letting you record test actions.