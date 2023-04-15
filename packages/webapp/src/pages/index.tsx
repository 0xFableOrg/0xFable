import Link from "next/link"
import { useAccount, useNetwork } from "wagmi"
import { useWeb3Modal, Web3Button, Web3NetworkSwitch } from "@web3modal/react"

import { CreateGameModal } from "src/components/modals/createGameModal"
import { JoinGameModal } from "src/components/modals/joinGameModal"
import { MintDeckModal } from "src/components/modals/mintDeckModal"
import { useIsMounted } from "src/hooks/useIsMounted"

const LOCALHOST = 1337

const Home = () => {
  const isMounted = useIsMounted()
  const { address } = useAccount()
  const { open } = useWeb3Modal()
  const { chain } = useNetwork()

  // These three states are mutually exclusive. One of them is always true.
  const notConnected = !isMounted || !address
  const isWrongNetwork = !notConnected && chain?.id !== LOCALHOST
  const isRightNetwork = !notConnected && chain?.id === LOCALHOST

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
              onClick={async () => {
                await open();
              }}
            >
              Connect Wallet
            </button>
          </div>
        }

        {isWrongNetwork && <Web3NetworkSwitch />}

        {isRightNetwork && <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-8">
            <CreateGameModal />
             <JoinGameModal />
             <MintDeckModal callback={() => {}} />
             <Link className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800" href={"/collection"}>
              Collection →
             </Link>
          </div>

          {/* TODO: Theme the button */}
          <Web3Button />
        </>}
      </div>
    </main>
  </>
}

export default Home