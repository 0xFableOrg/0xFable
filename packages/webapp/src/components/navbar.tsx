import Link from "next/link"
import { ConnectKitButton } from "connectkit"

export const Navbar = () => {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link
          href={"/"}
          className="btn-ghost btn font-serif text-2xl normal-case text-white"
        >
          <span className="font-mono font-light text-red-400">0x</span>
          FABLE
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/collection" className="font-bold ">
              COLLECTION
            </Link>
          </li>
          <li>
            <ConnectKitButton />
          </li>
        </ul>
      </div>
    </div>
  )
}
