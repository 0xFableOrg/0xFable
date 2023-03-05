import { Web3Button } from "@web3modal/react";
import Link from "next/link";

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
          {/* <li>
            <a>MY COLLECTION</a>
          </li> */}
          <li>
            <Link href="/" className="font-bold ">
              MENU
            </Link>
          </li>
          <li>
            <Web3Button />
          </li>
        </ul>
      </div>
    </div>
  );
};
