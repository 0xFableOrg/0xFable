// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "openzeppelin/token/ERC721/ERC721.sol";

contract CardsCollection is ERC721 {
    constructor() ERC721("Cards", "CARD") {}
}
