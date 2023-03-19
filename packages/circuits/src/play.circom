pragma circom 2.0.0;

include "./lib/merkle.circom";

template Play(levels) {
    signal input handRoot;
    signal input newHandRoot;
    signal input playedCardLeaf;
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

component main {public [handRoot, newHandRoot, playedCardLeaf]} = Play(6);