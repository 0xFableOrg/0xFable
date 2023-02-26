// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./CardsCollection.sol";

import "openzeppelin/token/ERC721/ERC721.sol";

contract InventoryCardsCollection is ERC721 {

    error CardNotInInventory(uint256 cardID);

    CardsCollection public cardsCollection;
    address public inventory;

    constructor(CardsCollection cardsCollection_) ERC721("Inventory Cards", "ICARD") {
        cardsCollection = cardsCollection_;
        inventory = msg.sender;
    }

    function mint(address to, uint256 tokenID) external {
        if (cardsCollection.ownerOf(tokenID) != inventory)
            revert CardNotInInventory(tokenID);
        _safeMint(to, tokenID);
    }
}
