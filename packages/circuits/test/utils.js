module.exports = {
    bytesPacking: function(arr) {
        elements = [];
        for (let i = 0; i < 2; i++) {
            let bytes = "";
            for (let j = 0; j < 32; j++) {
                const byte = arr[i * 32 + j].toString(16);
                if (byte.length < 2) {
                    bytes += "0" + byte;
                } else {
                    bytes += byte;
                }
            }
            bytes = "0x" + bytes;
            elements.push(BigInt(bytes));
        }
        return elements;
    }
}