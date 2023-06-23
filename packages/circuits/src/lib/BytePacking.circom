pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/bitify.circom";

template UnpackCards(n) {

    signal input packedCards[n];
    signal output unpackedCards[n*32];
    
    // unpack cards into bits
    component unpackToBits[2];
    signal cardInBits[n*256]; // each packed card can hold 256 bits
    for (var i = 0; i < n; i++) {
        unpackToBits[i] = Num2Bits(256);
        unpackToBits[i].in <== packedCards[i];
        for (var j = 0; j < 256; j++) {
            cardInBits[j + i*256] <== unpackToBits[i].out[j];
        }
    }

    // convert bits to numbers, where each number takes 8 bits (1 byte)
    component convertToNum[n*32]; // each packed card can hold 32 numbers
    for (var i = 0; i < n*32; i++) {
        convertToNum[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            convertToNum[i].in[j] <== cardInBits[j + i*8];
        }
        unpackedCards[i] <== convertToNum[i].out;
    }
}

template PackCards(n) {

    signal input unpackedCards[n*32];
    signal output packedCards[n];

    // convert numbers to bits, where each number takes 8 bits (1 byte)
    component convertToBits[n*32];
    signal cardInBits[n*256]; // each packed card can hold 256 bits
    for (var i = 0; i < n*32; i++) {
        convertToBits[i] = Num2Bits(8);
        convertToBits[i].in <== unpackedCards[i];
        for (var j = 0; j < 8; j++) {
            cardInBits[j + i*8] <== convertToBits[i].out[j];
        }
    }

    // pack cards into elements, where each element hold 256 bits
    component packToElements[n];
    for (var i = 0; i < n; i++) {
        packToElements[i] = Bits2Num(256);
        for (var j = 0; j < 256; j++) {
            packToElements[i].in[j] <== cardInBits[j + i*256];
        }
        packedCards[i] <== packToElements[i].out;
    }
}
