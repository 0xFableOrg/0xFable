import {BigNumber, ethers} from "ethers";
import { create } from "zustand";

type Store = {
  gameID: ethers.BigNumberish | null;
  selectedCard: ethers.BigNumberish | null;
  playerHand: ethers.BigNumberish[] | null;
  playerBoard: ethers.BigNumberish[] | null;
  enemyBoard: ethers.BigNumberish[] | null;
  setGameID: (gameID: ethers.BigNumberish) => void;
  setSelectedCard: (selectedCard: ethers.BigNumberish) => void;
  addtoPlayerBoard: (card: ethers.BigNumberish) => void;
  addtoEnemyBoard: (card: ethers.BigNumberish) => void;
  addtoPlayerHand: (card: ethers.BigNumberish) => void;
  removefromPlayerHand: (index: ethers.BigNumberish) => void;
};

const useStore = create<Store>()((set) => ({
  gameID: null,
  selectedCard: null,
  playerBoard: [],
  playerHand: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  enemyBoard: [],
  setGameID: (gameID) => set({ gameID }),
  setSelectedCard: (selectedCard) => set({ selectedCard }),
  addtoPlayerBoard: (card) =>
    set((state) => ({ playerBoard: [...state.playerBoard, card] })),
  addtoEnemyBoard: (card) =>
    set((state) => ({ enemyBoard: [...state.enemyBoard, card] })),
  addtoPlayerHand: (card) =>
    set((state) => ({ playerHand: [...state.playerHand, card] })),
  removefromPlayerHand: (index) =>
    set((state) => ({
      playerHand: state.playerHand.splice(BigNumber.from(index).toNumber(), 1),
    })),
}));

export default useStore;
