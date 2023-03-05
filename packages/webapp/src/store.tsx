import { ethers } from "ethers";
import { create } from "zustand";
import {
  useGamePlayerTimedOutEvent,
  useGameGameCreatedEvent,
} from "./generated";

type Store = {
  gameID: ethers.BigNumberish | null;
  setGameID: (gameId: ethers.BigNumberish) => void;
};

const useStore = create<Store>()((set) => ({
  gameID: null,
  setGameID: (gameID) => set({ gameID }),
}));

export default useStore;
