import Link from "next/link";
import { useAccount, useWaitForTransaction } from "wagmi";
import {
  usePrepareGameCreateGame,
  useGameCreateGame,
  useGame,
} from "../../generated";
import useStore from "../../store";

export const CreateGameModal = () => {
  const gameId = useStore((state) => state.gameId);

  const gameContract = useGame({
    address: process.env.NEXT_PUBLIC_GAME_CONTRACT,
  });

  const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
  const sigHash = gameContract.interface.getSighash(fragment);

  const hash = (
    process.env.NEXT_PUBLIC_GAME_CONTRACT + sigHash.slice(2)
  ).padEnd(66, "0");

  const { config, error } = usePrepareGameCreateGame({
    address: process.env.NEXT_PUBLIC_GAME_CONTRACT as `0x${string}`,
    args: [2],
    enabled: false,
  });

  const { data, write } = useGameCreateGame({
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
      {/* The button to open modal */}
      <label
        htmlFor="create"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
      >
        Create Game →
      </label>

      {/* Put this part before </body> tag */}
      <input type="checkbox" id="create" className="modal-toggle" />
      <label htmlFor="create" className="modal cursor-pointer">
        <label className="modal-box relative" htmlFor="">
          <h3 className="text-xl font-bold normal-case">Create Game</h3>
          {!gameId && (
            <>
              <p className="py-4">
                Once a game is created, you can invite your friends to join with
                the game ID.
              </p>
              <button
                className="btn"
                // disabled={!write || isLoading}
                onClick={() => write?.()}
              >
                Create Game
              </button>
            </>
          )}
          {gameId && (
            <>
              <p className="py-4 font-mono">
                Share the following code to invite players to battle:
              </p>
              <p className="mb-5 rounded-xl border border-white/50 bg-black py-4 text-center font-mono">
                {gameId.toString()}
              </p>
              <Link className="btn" href={"/play"} onClick={() => write?.()}>
                Let&apos;s Play!
              </Link>
            </>
          )}
        </label>
      </label>
    </>
  );
};
