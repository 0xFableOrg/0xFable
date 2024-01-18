// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Constants} from "./Constants.sol";

library Utils {
    // https://gist.github.com/subhodi/b3b86cc13ad2636420963e692a4d896f
    function sort(uint256[] memory data) internal view returns (uint256[] memory) {
        quickSort(data, int256(0), int256(data.length - 1));
        return data;
    }

    function quickSort(uint256[] memory arr, int256 left, int256 right) internal view {
        int256 i = left;
        int256 j = right;
        if (i == j) return;
        uint256 pivot = arr[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint256(i)] < pivot) i++;
            while (pivot < arr[uint256(j)]) j--;
            if (i <= j) {
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
                i++;
                j--;
            }
        }
        if (left < j) {
            quickSort(arr, left, j);
        }
        if (i < right) {
            quickSort(arr, i, right);
        }
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
