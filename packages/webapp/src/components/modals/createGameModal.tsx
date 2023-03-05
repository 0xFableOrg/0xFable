import { useAccount, useWaitForTransaction } from "wagmi";
import {
  usePrepareGameCreateGame,
  useGameCreateGame,
  useGame,
} from "../../generated";

export const CreateGameModal = () => {
  const { address, isConnecting, isDisconnected } = useAccount();

  const gameContract = useGame({
    address: process.env.NEXT_PUBLIC_GAME_CONTRACT,
  });

  const fragment = gameContract.interface.getFunction("allowAnyPlayerAndDeck");
  const sigHash = gameContract.interface.getSighash(fragment);

  const hash = (
    process.env.NEXT_PUBLIC_GAME_CONTRACT + sigHash.slice(2)
  ).padEnd(66, "0");

  console.log(hash);
  const { config, error } = usePrepareGameCreateGame({
    address: process.env.NEXT_PUBLIC_GAME_CONTRACT as `0x${string}`,
    args: [2, hash as `0x${string}`],
    // enabled: true,
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
          <h3 className="text-xl font-bold normal-case">Creating Game...</h3>
          <p className="py-4">
            You've been selected for a chance to get one year of subscription to
            use Wikipedia for free!
          </p>
          <button
            className="btn"
            // disabled={!write || isLoading}
            onClick={() => write?.()}
          >
            Create Game
          </button>
        </label>
      </label>
    </>
  );
};
