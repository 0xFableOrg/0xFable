pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/bitify.circom";

/// @dev when dealing with Num2Bits in circom, LSB is stored in index 0, MSB in last index
/// @dev therefore when converting from bits to numbers (Bits2Num) and vice versa (Num2Bits)
/// @dev we need to first reverse the order of the cards
template UnpackCards(n) {

    signal input packedCards[n];
    signal output unpackedCards[n*31];
    
    // unpack cards into bits
    component unpackToBits[n];
    signal cardInBits[n*248]; // each packed card can hold 248 bits (first 8 bits ignored)
    for (var i = 0; i < n; i++) {
        unpackToBits[i] = Num2Bits(248);
        unpackToBits[i].in <== packedCards[i];
        for (var j = 0; j < 248; j++) {
            cardInBits[j + (1-i)*248] <== unpackToBits[i].out[j];
        }
    }

    // convert bits to numbers, where each number takes 8 bits (1 byte)
    component convertToNum[n*31]; // each packed card can hold 31 numbers
    for (var i = 0; i < n*31; i++) {
        convertToNum[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            convertToNum[i].in[j] <== cardInBits[j + i*8];
        }
        // reverse the order of the numbers
        unpackedCards[(n*31)-1-i] <== convertToNum[i].out;
    }
}

template PackCards(n) {

    signal input unpackedCards[n*31];
    signal output packedCards[n];

    // convert numbers to bits, where each number takes 8 bits (1 byte)
    component convertToBits[n*31];
    signal cardInBits[n*248]; // each packed card can hold 248 bits (first 8 bits ignored)
    for (var i = 0; i < n*31; i++) {
        convertToBits[i] = Num2Bits(8);
        // reverse the order of the numbers
        convertToBits[i].in <== unpackedCards[(n*31)-1-i];
        for (var j = 0; j < 8; j++) {
            cardInBits[j + i*8] <== convertToBits[i].out[j];
        }
    }

    // pack cards into elements, where each element hold 248 bits
    component packToElements[n];
    for (var i = 0; i < n; i++) {
        packToElements[i] = Bits2Num(248);
        for (var j = 0; j < 248; j++) {
            packToElements[i].in[j] <== cardInBits[j + (1-i)*248];
        }
        packedCards[i] <== packToElements[i].out;
    }
}
