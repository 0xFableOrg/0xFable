import Link from "next/link";
import { useWaitForTransaction } from "wagmi";
import {
  usePrepareGameCreateGame,
  useGameCreateGame,
  useGame,
} from "../../generated";
import useStore from "../../store";

const deployment = require('../../../../contracts/out/deployment.json');

export const CreateGameModal = () => {
  const gameID = useStore((state) => state.gameID);
  const setGameID = useStore((state) => state.setGameID);

  const gameContract = useGame({
    address: deployment.Game
  });

  // NOTE(norswap): This is how to compute the encoding of the joincheck callback, however, ethers
  //   will block us from using it, and will not provide built-in things for encoding it.

  // const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
  // const sigHash = gameContract.interface.getSighash(fragment);
  //
  // const hash = (
  //   process.env.NEXT_PUBLIC_GAME_CONTRACT + sigHash.slice(2)
  // ).padEnd(66, "0");

  const { config } = usePrepareGameCreateGame({
    address: deployment.Game as `0x${string}`,
    args: [2]
  });

  const { data, write } = useGameCreateGame(config);

  useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data) {
      const event = gameContract.interface.parseLog(data.logs[0]);
      setGameID(event.args.gameID)
    }
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
          {!gameID && (
            <>
              <p className="py-4">
                Once a game is created, you can invite your friends to join with
                the game ID.
              </p>
              <button
                className="btn"
                disabled={!write}
                onClick={() => {
                  write?.()
                }}
              >
                Create Game
              </button>
            </>
          )}
          {gameID && (
            <>
              <p className="py-4 font-mono">
                Share the following code to invite players to battle:
              </p>
              <p className="mb-5 rounded-xl border border-white/50 bg-black py-4 text-center font-mono">
                {gameID.toString()}
              </p>
              <Link className="btn" href={"/play"}>
                Let&apos;s Play!
              </Link>
            </>
          )}
        </label>
      </label>
    </>
  );
};
