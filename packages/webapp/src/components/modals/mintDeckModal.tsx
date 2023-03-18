import {
  useCardsCollectionSetApprovalForAll,
  useDeckAirdropClaimAirdrop,
  useInventorySetDelegation,
  usePrepareCardsCollectionSetApprovalForAll,
  usePrepareDeckAirdropClaimAirdrop,
  usePrepareInventorySetDelegation
} from "../../generated";
import {useWaitForTransaction} from "wagmi";
import {useState} from "react";
import { deployment } from "deployment";

export const MintGameModal = () => {

  const [invDelegated, setInvDelegated] = useState(false);
  const [airDelegated, setAirDelegated] = useState(false);

  const { config: approvalConfig } = usePrepareCardsCollectionSetApprovalForAll({
    address: deployment.CardsCollection,
    args: [deployment.Inventory, true]
  });

  const { data, write: invDelegate } = useCardsCollectionSetApprovalForAll(approvalConfig);

  useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data) {
      setInvDelegated(true);
    }
  });

  const { config: delegationConfig } = usePrepareInventorySetDelegation({
    address: deployment.Inventory,
    args: [deployment.DeckAirdrop, true],
    enabled: invDelegated
  });

  const { data: data2, write: airDelegate } = useInventorySetDelegation(delegationConfig);

  useWaitForTransaction({
    hash: data2?.hash,
    onSuccess(data) {
      setAirDelegated(true);
    }
  });

  const { config: airdropConfig } = usePrepareDeckAirdropClaimAirdrop({
    address: deployment.DeckAirdrop,
    enabled: airDelegated
  });

  const { data: data3, write: claim } = useDeckAirdropClaimAirdrop(airdropConfig);

  useWaitForTransaction({
    hash: data3?.hash,
    onSuccess(data) {
      (document.getElementById('my-modal-4') as any).checked = false;
    }
  });

  // TODO(LATER): check if we already have the approvals

  return (
    <>
      {/* The button to open modal */}
      <label
        htmlFor="my-modal-4"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
      >
        Mint deck →
      </label>

      {/* Put this part before </body> tag */}
      <input type="checkbox" id="my-modal-4" className="modal-toggle" />
      <label htmlFor="my-modal-4" className="modal cursor-pointer">
        <label className="modal-box relative" htmlFor="">
          <h3 className="text-lg font-bold">Minting Deck...</h3>
          <p className="py-4">
            Mint a deck of cards to play the game with your friends.
          </p>
          <button className="btn" onClick={invDelegate} disabled={invDelegated || !invDelegate}>
            Delegate to Inventory
          </button>
          <button className="btn" onClick={airDelegate} disabled={airDelegated || !invDelegated || !airDelegate}>
            Delegate to Airdropper
          </button>
          <button className="btn" onClick={claim} disabled={!airDelegated || !claim}>
            Mint Deck
          </button>
        </label>
      </label>
    </>
  );
};
