import { ConnectKitButton, useModal } from "connectkit";
import Link from "next/link";
import { useAccount, useNetwork } from "wagmi";

import { Address, chains } from "src/chain";
import { CreateGameModal } from "src/components/modals/createGameModal";
import { JoinGameModal } from "src/components/modals/joinGameModal";
import { MintDeckModal } from "src/components/modals/mintDeckModal";
import { Button } from "src/components/ui/button";
import { deployment } from "src/deployment";
import { useGameInGame } from "src/generated";
import { useOnlineStatus } from "src/hooks/useOnlineStatus";
import { FablePage } from "src/pages/_app";
import { useGameID } from "src/store/hooks";

const Home: FablePage = ({ isHydrated }) => {
  const { address } = useAccount();
  const { setOpen } = useModal();
  const { chain: usedChain } = useNetwork();
  const [_gameID, setGameID] = useGameID();

  // Refresh game ID and put it in the store.
  // noinspection JSDeprecatedSymbols
  useGameInGame({
    address: deployment.Game,
    args: [address as Address],
    enabled: !!address,
    onSuccess: (gameID) => {
      // 0 means we're not in a game
      if (gameID !== 0n) setGameID(gameID);
    },
  });

  const chainSupported = chains.some((chain) => chain.id === usedChain?.id);

  // These three states are mutually exclusive. One of them is always true.
  const notConnected = !isHydrated || !address;
  const isRightNetwork = !notConnected && chainSupported;
  const isWrongNetwork = !notConnected && !chainSupported;

  //status of the app
  const isOnline = useOnlineStatus();

  return (
    <main className="flex flex-col min-h-screen items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          <span className="font-mono font-light text-red-400">0x</span>FABLE
        </h1>

        {!isOnline && (
          <div className="justify-center items-center bg-black/80 flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-center justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="text-3xl font-semibold font-mono text-center">
                    App is offline
                  </h3>
                  <button className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none">
                    <span className="bg-transparent text-black  h-10 w-10 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  <p className="my-4 text-blueGray-500 font-mono text-lg leading-relaxed">
                    App is offline. Please check your connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {notConnected && (
          <div className="">
            <Button
              variant={"secondary"}
              className="border-2 border-yellow-500 normal-case hover:scale-105 font-fable text-xl hover:border-yellow-400"
              onClick={async () => setOpen(true)}
            >
              Connect Wallet
            </Button>
          </div>
        )}

        {isWrongNetwork && <ConnectKitButton />}

        {isRightNetwork && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-8">
              <CreateGameModal />
              <JoinGameModal />
              <MintDeckModal />
              <Link href={"/collection"}>
                <Button
                  variant="outline"
                  className="rounded-lg p-6 font-fable text-2xl border-green-900 border-2 h-16 hover:scale-105 hover:border-green-800 hover:border-3"
                >
                  Collection →
                </Button>
              </Link>
              <Link href={"/editor"}>
                <Button
                  variant="outline"
                  className="rounded-lg p-6 font-fable text-2xl border-green-900 border-2 h-16 hover:scale-105 hover:border-green-800 hover:border-3"
                >
                  Editor →
                </Button>
              </Link>
            </div>

            <ConnectKitButton />
          </>
        )}
      </div>
    </main>
  );
};

export default Home;
