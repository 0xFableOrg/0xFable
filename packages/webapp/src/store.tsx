import { ethers } from "ethers";
import { create } from "zustand";
import {
  useGamePlayerTimedOutEvent,
  useGameGameCreatedEvent,
} from "./generated";

type Store = {
  gameId: ethers.BigNumberish | null;
  setGameId: (gameId: ethers.BigNumberish) => void;
};

const useStore = create<Store>()((set) => ({
  gameId: null,
  setGameId: (gameId) => set({ gameId }),
}));

export default useStore;
