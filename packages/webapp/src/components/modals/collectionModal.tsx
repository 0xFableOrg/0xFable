export const CollectionGameModal = () => {


  return (
    <>
      <label
        htmlFor="collection"
        className="hover:border-3 btn-lg btn border-2 border-green-900 text-2xl normal-case hover:scale-105 hover:border-green-800"
      >
        Collection →
      </label>


      <input type="checkbox" id="collection" className="modal-toggle" />
      <label htmlFor="collection" className="modal cursor-pointer">
        <label className="modal-box relative" htmlFor="">
          <h3 className="text-xl font-bold normal-case">Collection</h3>
          <p className="py-4">
            This will bring you to your collection of cards.
          </p>
          <button className="btn" onClick={() => console.log(1)}>
            Collection
          </button>
        </label>
      </label>

    </>
  );
};
