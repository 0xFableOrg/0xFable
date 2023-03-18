import {
  useGame,
  useGameJoinGame,
  usePrepareGameJoinGame,
} from "../../generated";
import { useWaitForTransaction } from "wagmi";
import { BigNumber } from "ethers";
import { constants } from "ethers/lib";
import useStore from "../../store";
import { useState } from "react";
import { useRouter } from "next/router";
import { deployment } from "deployment";

export const JoinGameModal = () => {
  const [inputGameID, setInputGameID] = useState(null);
  const setGameID = useStore((state) => state.setGameID);
  const router = useRouter();

  const gameContract = useGame({
    address: deployment.Game,
  });

  const { config } = usePrepareGameJoinGame({
    address: deployment.Game,
    args: inputGameID
      ? [
          BigNumber.from(inputGameID),
          0,
          constants.HashZero,
          constants.HashZero,
          constants.HashZero,
          constants.HashZero,
        ]
      : undefined,
    enabled: inputGameID != undefined,
  });

  const { data, write } = useGameJoinGame(config);

  useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0]);
      setGameID(event.args.gameID);
      router.push("/play");
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
            onChange={(e) => {
              setInputGameID(
                isPositiveInteger(e.target.value) ? e.target.value : null
              );
            }}
            className="input-bordered input-warning input mr-2 w-full max-w-xs"
          />

          <button
            className="btn"
            disabled={!inputGameID || !write}
            onClick={() => {
              write?.();
            }}
          >
            Join Game
          </button>
        </label>
      </label>
    </>
  );
};
