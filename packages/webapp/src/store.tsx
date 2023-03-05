import { ethers } from "ethers";
import { create } from "zustand";

type Store = {
  gameId: ethers.BigNumberish | null;
  selectedCard: ethers.BigNumberish | null;
  playerBoard: ethers.BigNumberish[] | null;
  enemyBoard: ethers.BigNumberish[] | null;
  setGameId: (gameId: ethers.BigNumberish) => void;
  setSelectedCard: (selectedCard: ethers.BigNumberish) => void;
  addtoPlayerBoard: (card: ethers.BigNumberish) => void;
  addtoEnemyBoard: (card: ethers.BigNumberish) => void;
};

const useStore = create<Store>()((set) => ({
  gameId: null,
  selectedCard: null,
  playerBoard: [],
  enemyBoard: [],
  setGameId: (gameId) => set({ gameId }),
  setSelectedCard: (selectedCard) => set({ selectedCard }),
  addtoPlayerBoard: (card) =>
    set((state) => ({ playerBoard: [...state.playerBoard, card] })),
  addtoEnemyBoard: (card) =>
    set((state) => ({ enemyBoard: [...state.enemyBoard, card] })),
}));

export default useStore;
