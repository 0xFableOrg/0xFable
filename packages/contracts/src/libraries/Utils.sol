// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Constants} from "./Constants.sol";

library Utils {
    // https://gist.github.com/subhodi/b3b86cc13ad2636420963e692a4d896f
    function sort(uint[] memory data) internal view returns(uint[] memory) {
       quickSort(data, int(0), int(data.length - 1));
       return data;
    }
    
    function quickSort(uint[] memory arr, int left, int right) internal view {
        int i = left;
        int j = right;
        if(i==j) return;
        uint pivot = arr[uint(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint(i)] < pivot) i++;
            while (pivot < arr[uint(j)]) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSort(arr, left, j);
        if (i < right)
            quickSort(arr, i, right);
    }

    // ---------------------------------------------------------------------------------------------

    // Clear (zero) the contents of the array and make it zero-sized.
    function clear(uint8[] storage array) internal {
        // TODO should be done in assembly, avoiding to overwrite the size on every pop
        for (uint256 i = 0; i < array.length; ++i) {
            array.pop();
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true if the array contains the items.
    function contains(uint8[] storage array, uint8 item) internal view returns (bool) {
        for (uint256 i = 0; i < array.length; ++i) {
            if (array[i] == item) return true;
        }
        return false;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns true if the array contains duplicate elements (in O(n) time). 255 (NONE) is ignored.
    function hasDuplicate(uint8[] calldata array) internal pure returns (bool) {
        uint256 bitmap = 0;
        for (uint256 i = 0; i < array.length; ++i) {
            if (array[i] != Constants.NONE && (bitmap & (1 << array[i])) != 0) return true;
            bitmap |= 1 << array[i];
        }
        return false;
    }
}