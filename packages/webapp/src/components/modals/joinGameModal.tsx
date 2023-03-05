import { useGameJoinGame, usePrepareGameJoinGame } from "../../generated";
import { useWaitForTransaction } from "wagmi";
import { useState } from "react";
import { BigNumber, ethers } from "ethers";
import { constants } from "ethers/lib";

export const JoinGameModal = () => {
  const [gameId, setGameId] = useState<null | ethers.BigNumberish>(null);

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
    enabled: false,
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

  //check if string is a postive integer
  const isPositiveInteger = (str: string) => {
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
  };

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
          <p className="py-4">Enter the game ID you want to join.</p>
          <input
            type="number"
            placeholder="Game ID"
            min={0}
            onChange={(e) =>
              setGameId(
                isPositiveInteger(e.target.value) ? e.target.value : null
              )
            }
            className="input-bordered input-warning input mr-2 w-full max-w-xs"
          />

          <button
            className="btn"
            disabled={isLoading || !gameId}
            onClick={() => write?.()}
          >
            Join Game
          </button>
        </label>
      </label>
    </>
  );
};
