module.exports = {
    bytesPacking: function(arr) {
        // 31 cards per field element
        elements = [];
        for (let i = 0; i < 2; i++) {
            let bytes = "";
            for (let j = 0; j < 31; j++) {
                const byte = arr[i * 31 + j].toString(16);
                if (byte.length < 2) {
                    bytes = "0" + byte + bytes;
                } else {
                    bytes = byte + bytes;
                }
            }
            bytes = "0x00" + bytes;
            elements.push(BigInt(bytes));
        }
        return elements;
    }
}