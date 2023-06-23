// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.0;

import {CardsCollection, Card} from "./CardsCollection.sol";

import {ERC721} from "openzeppelin/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";

contract InventoryCardsCollection is ERC721, ERC721Enumerable {
    error CardNotInInventory(uint256 cardID);
    error CallerNotInventory();
    error TokenIsSoulbound();

    CardsCollection public cardsCollection;
    address public inventory;

    constructor(CardsCollection cardsCollection_) ERC721("Inventory Cards", "ICARD") {
        cardsCollection = cardsCollection_;
        inventory = msg.sender;
    }

    // Override ERC721 & ERC721Enumerable "supportsInterface" to support both interfaces
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return ERC721.supportsInterface(interfaceId) || ERC721Enumerable.supportsInterface(interfaceId);
    }

    function mint(address to, uint256 tokenID) external {
        // No need to check for caller: inventory is minted after card transfer,
        // and minting can only occur once.
        if (cardsCollection.ownerOf(tokenID) != inventory) {
            revert CardNotInInventory(tokenID);
        }
        _safeMint(to, tokenID);
    }

    function burn(uint256 tokenID) external {
        if (msg.sender != inventory) {
            revert CallerNotInventory();
        }
        _burn(tokenID);
    }

    // Override ERC721 & ERC721Enumerable "_beforeTokenTransfer" to support both interfaces
    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        if (from != address(0) && to != address(0)) {
            revert TokenIsSoulbound();
        }
    }

    function getOwnedTokens(address owner) private view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokens;
    }

    // Return the list of cards in the collection of the given player.
    function getCollection(address player) external view returns (Card[] memory collectionCards) {
        uint256[] memory collectionTokensId = getOwnedTokens(player);
        collectionCards = new Card[](collectionTokensId.length);
        for (uint256 i = 0; i < collectionTokensId.length; ++i) {
            collectionCards[i] = cardsCollection.getCard(collectionTokensId[i]);
        }
        return collectionCards;
    }
}
