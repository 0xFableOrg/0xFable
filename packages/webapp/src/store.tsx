import { ethers } from "ethers";
import { create } from "zustand";
import {
  useGamePlayerTimedOutEvent,
  useGameGameCreatedEvent,
} from "./generated";

type GameStore = {
  gameId: ethers.BigNumberish | null;
  setGameId: (gameId: ethers.BigNumberish) => void;
};

const useGameStore = create<GameStore>()((set) => ({
  gameId: null,
  setGameId: (gameId) => set({ gameId }),
}));

export default useGameStore;
