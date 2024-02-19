export const gameABI = [
    {
      stateMutability: 'nonpayable',
      type: 'constructor',
      inputs: [
        {
          name: 'inventory_',
          internalType: 'contract Inventory',
          type: 'address',
        },
        {
          name: 'drawVerifier_',
          internalType: 'contract Groth16Verifier',
          type: 'address',
        },
        {
          name: 'playVerifier_',
          internalType: 'contract Groth16Verifier',
          type: 'address',
        },
        {
          name: 'drawHandVerifier_',
          internalType: 'contract Groth16Verifier',
          type: 'address',
        },
        { name: 'checkProofs_', internalType: 'bool', type: 'bool' },
        { name: 'noRandom_', internalType: 'bool', type: 'bool' },
      ],
    },
    { type: 'error', inputs: [], name: 'AlreadyDrew' },
    { type: 'error', inputs: [], name: 'AlreadyJoined' },
    { type: 'error', inputs: [], name: 'CardIndexTooHigh' },
    { type: 'error', inputs: [], name: 'FalseStart' },
    { type: 'error', inputs: [], name: 'GameAlreadyEnded' },
    { type: 'error', inputs: [], name: 'GameAlreadyLocked' },
    { type: 'error', inputs: [], name: 'GameIsFull' },
    { type: 'error', inputs: [], name: 'ImplementationError' },
    { type: 'error', inputs: [], name: 'InvalidProof' },
    { type: 'error', inputs: [], name: 'NoGameNoLife' },
    { type: 'error', inputs: [], name: 'NotAllowedToJoin' },
    { type: 'error', inputs: [], name: 'OvereagerCanceller' },
    { type: 'error', inputs: [], name: 'OvereagerCreator' },
    { type: 'error', inputs: [], name: 'PlayerNotInGame' },
    { type: 'error', inputs: [], name: 'WrongPlayer' },
    { type: 'error', inputs: [], name: 'WrongStep' },
    { type: 'error', inputs: [], name: 'YoullNeverPlayAlone' },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        { name: 'player', internalType: 'uint8', type: 'uint8', indexed: false },
      ],
      name: 'CardDrawn',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        { name: 'player', internalType: 'uint8', type: 'uint8', indexed: false },
        {
          name: 'card',
          internalType: 'uint256',
          type: 'uint256',
          indexed: false,
        },
      ],
      name: 'CardPlayed',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
      ],
      name: 'Champion',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
        {
          name: 'cardIndex',
          internalType: 'uint8',
          type: 'uint8',
          indexed: false,
        },
      ],
      name: 'CreatureDestroyed',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'FullHouse',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'GameCancelled',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: false,
        },
        {
          name: 'creator',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
      ],
      name: 'GameCreated',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'GameStarted',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'MissingPlayers',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'attackingPlayer',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
        {
          name: 'defendingPlayer',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
      ],
      name: 'PlayerAttacked',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
      ],
      name: 'PlayerConceded',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
      ],
      name: 'PlayerDefeated',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'attackingPlayer',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
        {
          name: 'defendingPlayer',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
      ],
      name: 'PlayerDefended',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
      ],
      name: 'PlayerDrewHand',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
      ],
      name: 'PlayerJoined',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
      ],
      name: 'PlayerTimedOut',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'gameID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: false,
        },
      ],
      name: 'TurnEnded',
    },
    {
      stateMutability: 'pure',
      type: 'function',
      inputs: [
        { name: '', internalType: 'uint256', type: 'uint256' },
        { name: '', internalType: 'address', type: 'address' },
        { name: '', internalType: 'uint8', type: 'uint8' },
        { name: '', internalType: 'bytes', type: 'bytes' },
      ],
      name: 'allowAnyPlayerAndDeck',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'targetPlayer', internalType: 'uint8', type: 'uint8' },
        { name: 'attacking', internalType: 'uint8[]', type: 'uint8[]' },
      ],
      name: 'attack',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'gameID', internalType: 'uint256', type: 'uint256' }],
      name: 'cancelGame',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'cardsCollection',
      outputs: [
        { name: '', internalType: 'contract CardsCollection', type: 'address' },
      ],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'gameID', internalType: 'uint256', type: 'uint256' }],
      name: 'concedeGame',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'numberOfPlayers', internalType: 'uint8', type: 'uint8' }],
      name: 'createGame',
      outputs: [{ name: 'gameID', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'defending', internalType: 'uint8[]', type: 'uint8[]' },
      ],
      name: 'defend',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'handRoot', internalType: 'bytes32', type: 'bytes32' },
        { name: 'deckRoot', internalType: 'bytes32', type: 'bytes32' },
        { name: 'proofA', internalType: 'uint256[2]', type: 'uint256[2]' },
        { name: 'proofB', internalType: 'uint256[2][2]', type: 'uint256[2][2]' },
        { name: 'proofC', internalType: 'uint256[2]', type: 'uint256[2]' },
      ],
      name: 'drawCard',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'drawHandVerifier',
      outputs: [
        { name: '', internalType: 'contract Groth16Verifier', type: 'address' },
      ],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'handRoot', internalType: 'bytes32', type: 'bytes32' },
        { name: 'deckRoot', internalType: 'bytes32', type: 'bytes32' },
        { name: 'proofA', internalType: 'uint256[2]', type: 'uint256[2]' },
        { name: 'proofB', internalType: 'uint256[2][2]', type: 'uint256[2][2]' },
        { name: 'proofC', internalType: 'uint256[2]', type: 'uint256[2]' },
      ],
      name: 'drawInitialHand',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'drawVerifier',
      outputs: [
        { name: '', internalType: 'contract Groth16Verifier', type: 'address' },
      ],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'gameID', internalType: 'uint256', type: 'uint256' }],
      name: 'endTurn',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'fetchCards', internalType: 'bool', type: 'bool' },
      ],
      name: 'fetchGameData',
      outputs: [
        {
          name: '',
          internalType: 'struct FetchedGameData',
          type: 'tuple',
          components: [
            { name: 'gameID', internalType: 'uint256', type: 'uint256' },
            { name: 'gameCreator', internalType: 'address', type: 'address' },
            { name: 'players', internalType: 'address[]', type: 'address[]' },
            {
              name: 'playerData',
              internalType: 'struct PlayerData[]',
              type: 'tuple[]',
              components: [
                { name: 'health', internalType: 'uint16', type: 'uint16' },
                { name: 'defeated', internalType: 'bool', type: 'bool' },
                { name: 'deckStart', internalType: 'uint8', type: 'uint8' },
                { name: 'deckEnd', internalType: 'uint8', type: 'uint8' },
                { name: 'handSize', internalType: 'uint8', type: 'uint8' },
                { name: 'deckSize', internalType: 'uint8', type: 'uint8' },
                {
                  name: 'joinBlockNum',
                  internalType: 'uint256',
                  type: 'uint256',
                },
                { name: 'saltHash', internalType: 'uint256', type: 'uint256' },
                { name: 'handRoot', internalType: 'bytes32', type: 'bytes32' },
                { name: 'deckRoot', internalType: 'bytes32', type: 'bytes32' },
                { name: 'battlefield', internalType: 'uint256', type: 'uint256' },
                { name: 'graveyard', internalType: 'uint256', type: 'uint256' },
                { name: 'attacking', internalType: 'uint8[]', type: 'uint8[]' },
              ],
            },
            { name: 'lastBlockNum', internalType: 'uint256', type: 'uint256' },
            {
              name: 'publicRandomness',
              internalType: 'uint256',
              type: 'uint256',
            },
            { name: 'playersLeftToJoin', internalType: 'uint8', type: 'uint8' },
            { name: 'livePlayers', internalType: 'uint8[]', type: 'uint8[]' },
            { name: 'currentPlayer', internalType: 'uint8', type: 'uint8' },
            { name: 'currentStep', internalType: 'enum GameStep', type: 'uint8' },
            { name: 'attackingPlayer', internalType: 'address', type: 'address' },
            { name: 'cards', internalType: 'uint256[]', type: 'uint256[]' },
          ],
        },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
      name: 'gameData',
      outputs: [
        { name: 'gameCreator', internalType: 'address', type: 'address' },
        { name: 'lastBlockNum', internalType: 'uint256', type: 'uint256' },
        { name: 'playersLeftToJoin', internalType: 'uint8', type: 'uint8' },
        {
          name: 'joinCheck',
          internalType:
            'function (uint256,address,uint8,bytes) external returns (bool)',
          type: 'function',
        },
        { name: 'currentPlayer', internalType: 'uint8', type: 'uint8' },
        { name: 'currentStep', internalType: 'enum GameStep', type: 'uint8' },
        { name: 'attackingPlayer', internalType: 'address', type: 'address' },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'gameID', internalType: 'uint256', type: 'uint256' }],
      name: 'getCards',
      outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'player', internalType: 'address', type: 'address' },
      ],
      name: 'getPublicRandomness',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: '', internalType: 'address', type: 'address' }],
      name: 'inGame',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'inventory',
      outputs: [
        { name: '', internalType: 'contract Inventory', type: 'address' },
      ],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
        { name: 'saltHash', internalType: 'uint256', type: 'uint256' },
        { name: 'data', internalType: 'bytes', type: 'bytes' },
      ],
      name: 'joinGame',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'handRoot', internalType: 'bytes32', type: 'bytes32' },
        { name: 'cardIndexInHand', internalType: 'uint8', type: 'uint8' },
        { name: 'cardIndex', internalType: 'uint8', type: 'uint8' },
        { name: 'proofA', internalType: 'uint256[2]', type: 'uint256[2]' },
        { name: 'proofB', internalType: 'uint256[2][2]', type: 'uint256[2][2]' },
        { name: 'proofC', internalType: 'uint256[2]', type: 'uint256[2]' },
      ],
      name: 'playCard',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'playVerifier',
      outputs: [
        { name: '', internalType: 'contract Groth16Verifier', type: 'address' },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'player', internalType: 'address', type: 'address' }],
      name: 'playerActive',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'player', internalType: 'address', type: 'address' },
      ],
      name: 'playerData',
      outputs: [
        {
          name: '',
          internalType: 'struct PlayerData',
          type: 'tuple',
          components: [
            { name: 'health', internalType: 'uint16', type: 'uint16' },
            { name: 'defeated', internalType: 'bool', type: 'bool' },
            { name: 'deckStart', internalType: 'uint8', type: 'uint8' },
            { name: 'deckEnd', internalType: 'uint8', type: 'uint8' },
            { name: 'handSize', internalType: 'uint8', type: 'uint8' },
            { name: 'deckSize', internalType: 'uint8', type: 'uint8' },
            { name: 'joinBlockNum', internalType: 'uint256', type: 'uint256' },
            { name: 'saltHash', internalType: 'uint256', type: 'uint256' },
            { name: 'handRoot', internalType: 'bytes32', type: 'bytes32' },
            { name: 'deckRoot', internalType: 'bytes32', type: 'bytes32' },
            { name: 'battlefield', internalType: 'uint256', type: 'uint256' },
            { name: 'graveyard', internalType: 'uint256', type: 'uint256' },
            { name: 'attacking', internalType: 'uint8[]', type: 'uint8[]' },
          ],
        },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'gameID', internalType: 'uint256', type: 'uint256' },
        { name: 'player', internalType: 'address', type: 'address' },
      ],
      name: 'playerDeck',
      outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'gameID', internalType: 'uint256', type: 'uint256' }],
      name: 'timeout',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [],
      name: 'toggleCheckProofs',
      outputs: [],
    },
  ] as const
  
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Inventory
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  export const inventoryABI = [
    {
      stateMutability: 'nonpayable',
      type: 'constructor',
      inputs: [
        { name: 'deploySalt', internalType: 'bytes32', type: 'bytes32' },
        {
          name: 'cardsCollection_',
          internalType: 'contract CardsCollection',
          type: 'address',
        },
      ],
    },
    { type: 'error', inputs: [], name: 'BigDeckEnergy' },
    {
      type: 'error',
      inputs: [{ name: 'cardID', internalType: 'uint256', type: 'uint256' }],
      name: 'CardExceedsMaxCopy',
    },
    {
      type: 'error',
      inputs: [{ name: 'cardID', internalType: 'uint256', type: 'uint256' }],
      name: 'CardNotInInventory',
    },
    {
      type: 'error',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
      ],
      name: 'DeckDoesNotExist',
    },
    { type: 'error', inputs: [], name: 'OutOfDeckIDs' },
    {
      type: 'error',
      inputs: [{ name: 'player', internalType: 'address', type: 'address' }],
      name: 'PlayerIsInActiveGame',
    },
    { type: 'error', inputs: [], name: 'PlayerNotDelegatedToSender' },
    { type: 'error', inputs: [], name: 'SmallDeckEnergy' },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'cardID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'CardAdded',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        { name: 'deckID', internalType: 'uint8', type: 'uint8', indexed: true },
        {
          name: 'cardID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'CardAddedToDeck',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'cardID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'CardRemoved',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        { name: 'deckID', internalType: 'uint8', type: 'uint8', indexed: true },
        {
          name: 'cardID',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'CardRemovedFromDeck',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        { name: 'deckID', internalType: 'uint8', type: 'uint8', indexed: false },
      ],
      name: 'DeckAdded',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'player',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        { name: 'deckID', internalType: 'uint8', type: 'uint8', indexed: true },
      ],
      name: 'DeckRemoved',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'previousOwner',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'newOwner',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
      ],
      name: 'OwnershipTransferred',
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'MAX_DECKS',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'MAX_DECK_SIZE',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'MIN_DECK_SIZE',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'cardID', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'addCard',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
        { name: 'cardID', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'addCardToDeck',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        {
          name: 'deck',
          internalType: 'struct Inventory.Deck',
          type: 'tuple',
          components: [
            { name: 'cards', internalType: 'uint256[]', type: 'uint256[]' },
          ],
        },
      ],
      name: 'addDeck',
      outputs: [{ name: 'deckID', internalType: 'uint8', type: 'uint8' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'airdrop',
      outputs: [{ name: '', internalType: 'address', type: 'address' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
      ],
      name: 'checkDeck',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
      name: 'delegations',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'game',
      outputs: [{ name: '', internalType: 'contract Game', type: 'address' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'cardIDArr', internalType: 'uint256[]', type: 'uint256[]' },
      ],
      name: 'getCardTypes',
      outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
      ],
      name: 'getDeck',
      outputs: [
        { name: 'deckCards', internalType: 'uint256[]', type: 'uint256[]' },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'player', internalType: 'address', type: 'address' }],
      name: 'getNumDecks',
      outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'inventoryCardsCollection',
      outputs: [
        {
          name: '',
          internalType: 'contract InventoryCardsCollection',
          type: 'address',
        },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'originalCardsCollection',
      outputs: [
        { name: '', internalType: 'contract CardsCollection', type: 'address' },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'owner',
      outputs: [{ name: '', internalType: 'address', type: 'address' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'cardID', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'removeCard',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
        { name: 'index', internalType: 'uint8', type: 'uint8' },
      ],
      name: 'removeCardFromDeck',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
      ],
      name: 'removeDeck',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'player', internalType: 'address', type: 'address' },
        { name: 'deckID', internalType: 'uint8', type: 'uint8' },
        {
          name: 'deck',
          internalType: 'struct Inventory.Deck',
          type: 'tuple',
          components: [
            { name: 'cards', internalType: 'uint256[]', type: 'uint256[]' },
          ],
        },
      ],
      name: 'replaceDeck',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        {
          name: 'airdrop_',
          internalType: 'contract DeckAirdrop',
          type: 'address',
        },
      ],
      name: 'setAirdrop',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'delegate', internalType: 'address', type: 'address' },
        { name: 'isDelegated', internalType: 'bool', type: 'bool' },
      ],
      name: 'setDelegation',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'game_', internalType: 'contract Game', type: 'address' }],
      name: 'setGame',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
      name: 'transferOwnership',
      outputs: [],
    },
  ] as const
  
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // InventoryCardsCollection
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  export const inventoryCardsCollectionABI = [
    {
      stateMutability: 'nonpayable',
      type: 'constructor',
      inputs: [
        {
          name: 'cardsCollection_',
          internalType: 'contract CardsCollection',
          type: 'address',
        },
      ],
    },
    { type: 'error', inputs: [], name: 'CallerNotInventory' },
    {
      type: 'error',
      inputs: [{ name: 'cardID', internalType: 'uint256', type: 'uint256' }],
      name: 'CardNotInInventory',
    },
    { type: 'error', inputs: [], name: 'TokenIsSoulbound' },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'owner',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'approved',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'tokenId',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'Approval',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'owner',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'operator',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
      ],
      name: 'ApprovalForAll',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        { name: 'from', internalType: 'address', type: 'address', indexed: true },
        { name: 'to', internalType: 'address', type: 'address', indexed: true },
        {
          name: 'tokenId',
          internalType: 'uint256',
          type: 'uint256',
          indexed: true,
        },
      ],
      name: 'Transfer',
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [{ name: 'tokenID', internalType: 'uint256', type: 'uint256' }],
      name: 'burn',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'cardsCollection',
      outputs: [
        { name: '', internalType: 'contract CardsCollection', type: 'address' },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
      name: 'getApproved',
      outputs: [{ name: '', internalType: 'address', type: 'address' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'player', internalType: 'address', type: 'address' }],
      name: 'getCollection',
      outputs: [
        {
          name: 'collectionCards',
          internalType: 'struct Card[]',
          type: 'tuple[]',
          components: [
            { name: 'id', internalType: 'uint256', type: 'uint256' },
            {
              name: 'lore',
              internalType: 'struct Lore',
              type: 'tuple',
              components: [
                { name: 'name', internalType: 'string', type: 'string' },
                { name: 'flavor', internalType: 'string', type: 'string' },
                { name: 'URL', internalType: 'string', type: 'string' },
              ],
            },
            {
              name: 'stats',
              internalType: 'struct Stats',
              type: 'tuple',
              components: [
                { name: 'attack', internalType: 'uint8', type: 'uint8' },
                { name: 'defense', internalType: 'uint8', type: 'uint8' },
              ],
            },
            { name: 'cardTypeID', internalType: 'uint32', type: 'uint32' },
          ],
        },
      ],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'inventory',
      outputs: [{ name: '', internalType: 'address', type: 'address' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'owner', internalType: 'address', type: 'address' },
        { name: 'operator', internalType: 'address', type: 'address' },
      ],
      name: 'isApprovedForAll',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'tokenID', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'mint',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'name',
      outputs: [{ name: '', internalType: 'string', type: 'string' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ name: '', internalType: 'address', type: 'address' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'from', internalType: 'address', type: 'address' },
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'safeTransferFrom',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'from', internalType: 'address', type: 'address' },
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
        { name: 'data', internalType: 'bytes', type: 'bytes' },
      ],
      name: 'safeTransferFrom',
      outputs: [],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'operator', internalType: 'address', type: 'address' },
        { name: 'approved', internalType: 'bool', type: 'bool' },
      ],
      name: 'setApprovalForAll',
      outputs: [],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
      name: 'supportsInterface',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', internalType: 'string', type: 'string' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
      name: 'tokenByIndex',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [
        { name: 'owner', internalType: 'address', type: 'address' },
        { name: 'index', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'tokenOfOwnerByIndex',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ name: '', internalType: 'string', type: 'string' }],
    },
    {
      stateMutability: 'view',
      type: 'function',
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    },
    {
      stateMutability: 'nonpayable',
      type: 'function',
      inputs: [
        { name: 'from', internalType: 'address', type: 'address' },
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'transferFrom',
      outputs: [],
    },
  ] as const
  