# Circuits

## Prerequisites

- Install Circom2 (currently this is done from source), as [explained here][circom-install].
    - check that `circom --version` works 
    - We tested with Circom 2.1.4

[circom-install]: https://docs.circom.io/getting-started/installation/

## Running tests

This only works on Linux currently.

```
# only the first time
make install-test-deps 

# in a shell (will remain active)
make test-server

# in another shell
make test
```