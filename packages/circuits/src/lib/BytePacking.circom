pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

/// @dev when dealing with Num2Bits in circom, LSB is stored in index 0, MSB in last index
/// @dev we use little endian when packing the cards
template UnpackCards(n) {

    signal input packedCards[n];
    signal output unpackedCards[n*31];
    
    // unpack cards into bytes
    component lt[n*31];
    for (var i = 0; i < n; i++) {
        var sum = 0;
        var mult = 1;
        var currentIndex;
        for (var j = 0; j < 31; j++) {
            currentIndex = (i*31)+j;
            unpackedCards[currentIndex] <-- (packedCards[i] >> (j*8)) & 255;
            lt[currentIndex] = LessEqThan(8);
            lt[currentIndex].in[0] <== unpackedCards[currentIndex];
            // Avoid comparison with 256, which is too high for 8 bits.
            // 255 will be unusable (used as the null value).
            lt[currentIndex].in[1] <== 255;
            lt[currentIndex].out === 1;
            sum += unpackedCards[currentIndex] * mult;
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
        var currentIndex;
        for (var j = 0; j < 31; j++) {
            currentIndex = (i*31)+j;
            lt[currentIndex] = LessEqThan(8);
            lt[currentIndex].in[0] <== unpackedCards[currentIndex];
            // Avoid comparison with 256, which is too high for 8 bits.
            // 255 will be unusable (used as the null value).
            lt[currentIndex].in[1] <== 255;
            lt[currentIndex].out === 1;
            sum += unpackedCards[currentIndex] * mult;
            var mult4 = mult + mult + mult + mult;
            var mult16 = mult4 + mult4 + mult4 + mult4;
            var mult64 = mult16 + mult16 + mult16 + mult16;
            mult = mult64 + mult64 + mult64 + mult64;
        }
        sum ==> packedCards[i];
    }
}
