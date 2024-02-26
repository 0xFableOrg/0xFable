

export const OfllineStatusModal = () => {

  return (

      <div className="justify-center items-center bg-black/80 flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          {/*content*/}
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-center justify-center p-5 border-b border-solid border-blueGray-200 rounded-t">
              <h3 className="text-3xl font-semibold font-mono text-center">
                App is offline
              </h3>
            </div>
            {/*body*/}
            <div className="relative p-6 flex-auto">
              <p className="my-4 text-blueGray-500 font-mono text-lg leading-relaxed">
                App is offline. Please check your internet connection.
              </p>
            </div>
          </div>
        </div>
      </div>

  );
};
