import { ConnectKitButton, useModal } from "connectkit"
import Link from "next/link"
import { useAccount, useNetwork } from "wagmi"

import { Address, chains } from "src/chain"
import { deployment } from "src/deployment"
import { CreateGameModal } from "src/components/modals/createGameModal"
import { JoinGameModal } from "src/components/modals/joinGameModal"
import { MintDeckModal } from "src/components/modals/mintDeckModal"
import { useGameInGame } from "src/generated"
import { FablePage } from "src/pages/_app"
import { useGameID } from "src/store/hooks"
import { createAccount } from "src/utils/accounts"

const Home: FablePage = ({ isHydrated }) => {
  const { address } = useAccount()
  const { setOpen } = useModal()
  const { chain: usedChain } = useNetwork()
  const [ _gameID, setGameID ] = useGameID()

  // Refresh game ID and put it in the store.
  // noinspection JSDeprecatedSymbols
  useGameInGame({
    address: deployment.Game,
    args: [address as Address],
    enabled: !!address,
    onSuccess: gameID => {
      // 0 means we're not in a game
      if (gameID !== 0n) setGameID(gameID)
    }
  })

  const chainSupported = chains.some(chain => chain.id === usedChain?.id)

  // These three states are mutually exclusive. One of them is always true.
  const notConnected = !isHydrated || !address
  const isRightNetwork = !notConnected && chainSupported
  const isWrongNetwork = !notConnected && !chainSupported

  return <>
    <main className="flex flex-col min-h-screen items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="font-serif text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          <span className="font-mono font-light text-red-400">0x</span>FABLE
        </h1>

        {notConnected &&
          <div className="">
            <button
              className="btn-lg btn border-2 border-yellow-500 normal-case hover:scale-105 hover:border-yellow-400"
              onClick={async () => setOpen(true)}
            >
              Connect Wallet
            </button>
            <button
              className="btn-lg btn border-2 border-yellow-500 normal-case hover:scale-105 hover:border-yellow-400"
              onClick={async () => {
                await createAccount();
              }}
            >
              Create Burner Wallet
            </button>
          </div>
        }

        {isWrongNetwork && <ConnectKitButton />}

        {isRightNetwork && <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 md:gap-8">
            <CreateGameModal />
            <JoinGameModal />
            <MintDeckModal />
            <Link className="hover:border-3 btn-lg btn btn-neutral border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800" href={"/collection"}>
              Collection →
            </Link>

            <Link className="hover:border-3 btn-lg btn btn-neutral border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800" href={"/editor"}>
              Editor →
            </Link>
          </div>  
          <ConnectKitButton />
        </>}
      </div>
    </main>
  </>
}

export default Home