import { useGameJoinGame, usePrepareGameJoinGame } from "../../generated";
import { useWaitForTransaction } from "wagmi";
import { useState } from "react";
import { BigNumber } from "ethers";
import { constants } from "ethers/lib";

export const JoinGameModal = () => {
  const [gameId, setGameId] = useState(5);

  const { config, error } = usePrepareGameJoinGame({
    address: process.env.NEXT_PUBLIC_INVENTORY_GAME_CONTRACT as `0x${string}`,
    args: gameId
      ? [
          BigNumber.from(gameId),
          0,
          constants.HashZero,
          constants.HashZero,
          constants.HashZero,
          constants.HashZero,
        ]
      : undefined,
    // enabled: false,
  });

  const { data, write } = useGameJoinGame({
    ...config,
    onMutate: () => {
      console.log("Transaction sent");
    },
    onSuccess: (data) => {
      console.log("Transaction sent");
    },
  });

  const {
    isLoading,
    error: txError,
    isSuccess,
  } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      console.log("Transaction success");
    },
  });

  return (
    <>
      <label
        htmlFor="join"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
      >
        Join →
      </label>

      <input type="checkbox" id="join" className="modal-toggle" />
      <label htmlFor="join" className="modal cursor-pointer">
        <label className="modal-box relative" htmlFor="">
          <h3 className="text-lg font-bold">Joining Game...</h3>
          {/* <p className="py-4">
            
          </p> */}
          <button
            className="btn"
            disabled={isLoading}
            onClick={() => write?.()}
          >
            Join Game
          </button>
        </label>
      </label>
    </>
  );
};
