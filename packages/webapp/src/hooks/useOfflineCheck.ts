
import { useState, useEffect } from 'react';


function useOfflineCheck(options : any = {}) {
  const {
    // Optional configuration properties:
    threshold = 1000, // Minimum interval between offline checks (ms)
    maxRetries = 3, // Maximum number of retries before assuming offline
    retryDelay = 1500, // Delay between retries (ms)
  } = options;

  const [isOffline, setIsOffline] = useState(false);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setRetries(0); // Reset retries on reconnection
    };

    const handleOffline = () => {
      if (retries < maxRetries) {
        setTimeout(() => {
          performNetworkCheck()
            .then(() => handleOnline()) // online
            .catch(() => {         
              setRetries(retries + 1); // Retry if error occurs
            });
        }, retryDelay);
      } else {
        setIsOffline(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial network check:
    performNetworkCheck()
      .then(() => {
        setIsOffline(false);
        setRetries(0);
      })
      .catch(() => {
        setIsOffline(true);
      });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [threshold, maxRetries, retryDelay, retries]);

  
  async function performNetworkCheck() {
    const endpoint = 'https://www.google.com';
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors', 
      });
      return response.ok;
    } catch (error) {
      throw error; // Rethrow for retries
    }
  }

  return isOffline;
}

export default useOfflineCheck;
