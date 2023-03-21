pragma circom 2.0.0;

include "../../src/merkle.circom";

component main {public [leaves, root]} = CheckMerkleRoot(2);