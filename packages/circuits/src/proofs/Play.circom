pragma circom 2.0.0;

include "../lib/Merkle.circom";

template Play(levels) {
    /// @dev levels do not include the top level root

    // public inputs
    signal input handRoot;
    signal input newHandRoot;
    signal input playedCardLeaf;

    // private inputs
    signal input playedCardIndex;
    signal input playedCardHashPath[levels];
    signal input tailCardLeaf;
    signal input tailCardIndex;
    signal input tailCardHashPath[levels];

    component checkRemoveLeaf = CheckRemoveLeaf(levels);
    checkRemoveLeaf.root <== handRoot;
    checkRemoveLeaf.newRoot <== newHandRoot;
    checkRemoveLeaf.removeLeaf <== playedCardLeaf;
    checkRemoveLeaf.removeIndex <== playedCardIndex;
    checkRemoveLeaf.removeHashPath <== playedCardHashPath;
    checkRemoveLeaf.tailLeaf <== tailCardLeaf;
    checkRemoveLeaf.tailIndex <== tailCardIndex;
    checkRemoveLeaf.tailHashPath <== tailCardHashPath;
}