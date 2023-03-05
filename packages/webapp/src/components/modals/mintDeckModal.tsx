export const MintGameModal = () => {
  // const { data } = useGameCreateGame();
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
          <button className="btn">Mint Deck</button>
        </label>
      </label>
    </>
  );
};
