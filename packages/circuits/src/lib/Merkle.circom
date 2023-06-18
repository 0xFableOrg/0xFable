pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/mimcsponge.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = MiMCSponge(2, 220, 1);
    hasher.ins[0] <== left;
    hasher.ins[1] <== right;
    hasher.k <== 0;
    hash <== hasher.outs[0];
}

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Verifies that merkle proof is correct for given merkle root and a leaf
// pathIndices input is an array of 0/1 selectors telling whether given pathElement is on the left or right side of merkle path
template CheckMembership(levels) {
    signal input root;
    signal input leaf;
    signal input index;
    signal input hashPath[levels];

    component constructRoot = ConstructRoot(levels);
    constructRoot.leaf <== leaf;
    constructRoot.index <== index;
    constructRoot.hashPath <== hashPath;

    root === constructRoot.root;
}

template CheckAppendToTail(levels) {
    signal input root;
    signal input newRoot;
    signal input appendLeaf;
    signal input tailLeaf;
    signal input tailIndex;
    signal input tailHashPath[levels];
    signal input appendHashPath[levels];

    component isZero = IsZero();
    isZero.in <== tailIndex;

    component checkTail = CheckTail(levels);
    checkTail.leaf <== tailLeaf;
    checkTail.index <== tailIndex;
    checkTail.hashPath <== tailHashPath;

    component checkTailMembership = CheckMembership(levels);
    checkTailMembership.root <== root;
    checkTailMembership.leaf <== tailLeaf;
    checkTailMembership.index <== tailIndex;
    checkTailMembership.hashPath <== tailHashPath;

    component checkReplaceTail = CheckReplaceLeaf(levels);
    checkReplaceTail.root <== root;
    checkReplaceTail.newRoot <== newRoot;
    checkReplaceTail.currLeaf <== 255;
    checkReplaceTail.newLeaf <== appendLeaf;
    checkReplaceTail.index <== tailIndex + 1 - isZero.out;
    checkReplaceTail.hashPath <== appendHashPath;
}

template CheckRemoveLeaf(levels) {
    signal input root;
    signal input newRoot;
    signal input removeLeaf;
    signal input removeIndex;
    signal input removeHashPath[levels];
    signal input tailLeaf;
    signal input tailIndex;
    signal input tailHashPath[levels];    

    component checkTail = CheckTail(levels);
    checkTail.leaf <== tailLeaf;
    checkTail.index <== tailIndex;
    checkTail.hashPath <== tailHashPath;

    component checkRemoveMembership = CheckMembership(levels);
    checkRemoveMembership.root <== root;
    checkRemoveMembership.leaf <== removeLeaf;
    checkRemoveMembership.index <== removeIndex;
    checkRemoveMembership.hashPath <== removeHashPath;

    component constructTempRoot = ConstructRoot(levels);
    constructTempRoot.leaf <== tailLeaf;
    constructTempRoot.index <== removeIndex;
    constructTempRoot.hashPath <== removeHashPath;

    component checkReplaceTail = CheckReplaceLeaf(levels);
    checkReplaceTail.root <== constructTempRoot.root;
    checkReplaceTail.newRoot <== newRoot;
    checkReplaceTail.currLeaf <== tailLeaf;
    checkReplaceTail.newLeaf <== 255;
    checkReplaceTail.index <== tailIndex;
    checkReplaceTail.hashPath <== tailHashPath;
}

template CheckReplaceLeaf(levels) {
    signal input root;
    signal input newRoot;
    signal input currLeaf;
    signal input newLeaf;
    signal input index;
    signal input hashPath[levels];

    component checkBefore = CheckMembership(levels);
    checkBefore.root <== root;
    checkBefore.leaf <== currLeaf;
    checkBefore.index <== index;
    checkBefore.hashPath <== hashPath;

    component checkAfter = CheckMembership(levels);
    checkAfter.root <== newRoot;
    checkAfter.leaf <== newLeaf;
    checkAfter.index <== index;
    checkAfter.hashPath <== hashPath;
}

template CheckTail(levels) {
    signal input leaf;
    signal input index;
    signal input hashPath[levels];

    component leafIsNull = IsEqual();
    component index2path = Num2Bits(levels);
    component zeroHashers[levels];

    leafIsNull.in[0] <== leaf;
    leafIsNull.in[1] <== 255;
    // tail can only be null if index is 0
    leafIsNull.out * index === 0;

    index2path.in <== index;

    var zeroHash = 255;
    for (var i = 0; i < levels; i++) {
        var s = index2path.out[i];
        var hash = hashPath[i];
        // hash must be null if sibling is on the right
        // TODO: replace 255 with hash at depth
        (1 - s) * (zeroHash - hash) === 0;

        zeroHashers[i] = HashLeftRight();
        zeroHashers[i].left <== zeroHash;
        zeroHashers[i].right <== zeroHash;
        zeroHash = zeroHashers[i].hash;
    }
}

template ConstructRoot(levels) {
    signal output root;
    signal input leaf;
    signal input index;
    signal input hashPath[levels];
    
    component selectors[levels];
    component hashers[levels];
    component index2path = Num2Bits(levels);

    index2path.in <== index;

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].hash;
        selectors[i].in[1] <== hashPath[i];
        selectors[i].s <== index2path.out[i];

        hashers[i] = HashLeftRight();
        hashers[i].left <== selectors[i].out[0];
        hashers[i].right <== selectors[i].out[1];
    }

    root <== hashers[levels - 1].hash;
}

template CheckMerkleRoot(levels) {
    signal input root;
    signal input leaves[2**levels];

    // merkle tree flattened into an array
    var flattenedTree[2**(levels+1)];
    // fit the leaves into hashers
    for (var i = 0; i < 2**levels; i++) {
        flattenedTree[2**levels+i] = leaves[i];
    }

    component hashers[(2**levels)];
    for (var i = 2**levels -1; i > 0; i--) {
        hashers[i] = HashLeftRight();
        hashers[i].left <== flattenedTree[2*i];
        hashers[i].right <== flattenedTree[2*i + 1];
        flattenedTree[i] = hashers[i].hash;
    }

    // check root
    root === flattenedTree[1];
}