// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import "./CardsCollection.sol";

import "openzeppelin/token/ERC721/ERC721.sol";

contract InventoryCardsCollection is ERC721 {

    error CardNotInInventory(uint256 cardID);
    error CallerNotInventory();

    CardsCollection public cardsCollection;
    address public inventory;

    constructor(CardsCollection cardsCollection_) ERC721("Inventory Cards", "ICARD") {
        cardsCollection = cardsCollection_;
        inventory = msg.sender;
    }

    function mint(address to, uint256 tokenID) external {
        // No need to check for caller: inventory is minted after card transfer,
        // and minting can only occur once.
        if (cardsCollection.ownerOf(tokenID) != inventory)
            revert CardNotInInventory(tokenID);
        _safeMint(to, tokenID);
    }

    function burn(uint256 tokenID) external {
        if (msg.sender != inventory)
            revert CallerNotInventory();
        _burn(tokenID);
    }
}
