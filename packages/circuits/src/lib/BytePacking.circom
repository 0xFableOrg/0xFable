pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

/// @dev when dealing with Num2Bits in circom, LSB is stored in index 0, MSB in last index
/// @dev therefore when converting from bits to numbers (Bits2Num) and vice versa (Num2Bits)
/// @dev we need to first reverse the order of the cards
template UnpackCards(n) {

    signal input packedCards[n];
    signal output unpackedCards[n*31];
    
    // unpack cards into bytes
    component lt[n*31];
    for (var i = 0; i < n; i++) {
        var sum = 0;
        var mult = 1;
        for (var j = 0; j < 31; j++) {
            unpackedCards[(i*31)+j] <-- (packedCards[i] >> (j*8)) & 255;
            lt[(i*31)+j] = LessEqThan(8);
            lt[(i*31)+j].in[0] <== unpackedCards[(i*31)+j];
            lt[(i*31)+j].in[1] <== 255;
            lt[(i*31)+j].out === 1;
            sum += unpackedCards[(i*31)+j] * mult;
            var mult4 = mult + mult + mult + mult;
            var mult16 = mult4 + mult4 + mult4 + mult4;
            var mult64 = mult16 + mult16 + mult16 + mult16;
            mult = mult64 + mult64 + mult64 + mult64;
        }
        sum === packedCards[i];
    }
}

template PackCards(n) {

    signal input unpackedCards[n*31];
    signal output packedCards[n];

    // pack cards into felt
    component lt[n*31];
    for (var i = 0; i < n; i++) {
        var sum = 0;
        var mult = 1;
        for (var j = 0; j < 31; j++) {
            lt[(i*31)+j] = LessEqThan(8);
            lt[(i*31)+j].in[0] <== unpackedCards[(i*31)+j];
            lt[(i*31)+j].in[1] <== 255;
            lt[(i*31)+j].out === 1;
            sum += unpackedCards[(i*31)+j] * mult;
            var mult4 = mult + mult + mult + mult;
            var mult16 = mult4 + mult4 + mult4 + mult4;
            var mult64 = mult16 + mult16 + mult16 + mult16;
            mult = mult64 + mult64 + mult64 + mult64;
        }
        sum ==> packedCards[i];
    }
}
