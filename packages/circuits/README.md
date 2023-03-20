# Circuits

## Prerequisites

- Install Circom2 (currently this is done from source), as [explained here][circom-install].
    - check that `circom --version` works 
    - We tested with Circom 2.1.4

[circom-install]: https://docs.circom.io/getting-started/installation/

## Running tests

To run the tests, make sure that in `circom.config.json`, the field `circom` is pointed to the right path

1. Open a terminal and `npm run circom-helper`.
2. In another terminal, `npm run test`. 
