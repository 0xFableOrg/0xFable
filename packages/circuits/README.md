# Circuits

## Prerequisites

- Install Circom2 (currently this is done from source), as [explained here][circom-install].
    - check that `circom --version` works 
    - We tested with Circom 2.1.4

[circom-install]: https://docs.circom.io/getting-started/installation/

## Running tests

`make test`

This will try to prove and verify the circuits with pre-generated inputs.

TODO: reuse logic from the frontend to generate the inputs automatically. The current procedure is
to run the application then print out the inputs from the browser console.

## Legacy Tests

This only works on Linux.

You'll also need to install the npm package `circom-helper`, either globally or locally (but don't
commit to git). We removed it because it caused [build
issues](https://github.com/norswap/0xFable/issues/53) on some configurations, and we're [moving away
from it anyway](https://github.com/norswap/0xFable/issues/52).

```
# only the first time
make install-test-deps 

# in a shell (will remain active)
make test-server

# in another shell
make test
```