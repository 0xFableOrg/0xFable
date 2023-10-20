import { clsx } from "clsx";
import * as store from "src/store/hooks";

interface PlayerBoardProps {
  playerAddress: `0x${string}` | null;
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ playerAddress }) => {
  const currentPlayerAddress = store.usePlayerAddress();
  return (
    <div
      className={clsx({
        "border-b-1 relative row-span-6 rounded-xl rounded-b-none border bg-base-300 shadow-inner":
          playerAddress === currentPlayerAddress,
        "relative row-span-6 rounded-xl rounded-t-none border border-t-0 bg-base-300 shadow-inner":
          playerAddress !== currentPlayerAddress,
      })}
    >
      <p className="z-0 m-2 font-mono font-bold"> 🛡 p2 address </p>
      <p className="z-0 m-2 font-mono font-bold"> ♥️ 100 </p>
    </div>
  );
};

export default PlayerBoard;
