import { Web3Button } from "@web3modal/react";

export const Navbar = () => {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn-ghost btn font-serif text-2xl normal-case text-white">
          <span className="font-mono font-light text-red-400">0x</span>
          FABLE
        </a>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a>MY COLLECTION</a>
          </li>
          <li>
            <a className="font-bold ">GET CARDS</a>
          </li>
          <li>
            <Web3Button />
          </li>
        </ul>
      </div>
    </div>
  );
};
