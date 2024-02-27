import { useState, useEffect } from "react";
import { toast } from "sonner";

async function performNetworkCheck() {
  const endpoint = "https://www.google.com";
  const response = await fetch(endpoint, {
    method: "HEAD",
    cache: "no-cache",
    mode: "no-cors",
  });
  return response.ok;
}

function useOfflineCheck(options: any = {}) {
  const {

    maxRetries = 3, // Maximum number of retries before assuming offline
    retryDelay = 1500, // Delay between retries (ms)
  } = options;

  const [retries, setRetries] = useState(0);
  

  useEffect(() => {
    const handleOffline = () => {
      if (retries < maxRetries) {
        setTimeout(() => {
          performNetworkCheck()
            .then(() => {
              setRetries(0);
              toast.dismiss();
            }) // online
            .catch(() => {
              const newRetry = retries + 1;
              setRetries(newRetry); // Retry if error occurs
            });
        }, retryDelay);
      } 
    };

    window.addEventListener("online", handleOffline);
    window.addEventListener("offline", handleOffline);

    // Initial network check:
    performNetworkCheck()
      .then(() => {
        setRetries(0);
      })
      .catch(() => {
        toast.error("App is offline. Please check your internet connection.",{ dismissible: false, duration: Infinity });
      });

    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [ maxRetries, retryDelay, retries]);

}

export default useOfflineCheck;
