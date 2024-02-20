// import { useState, useEffect } from "react";

// export const useOnlineStatus = (interval = 10000) => {
//   const [isOnline, setIsOnline] = useState(true);

//   useEffect(() => {
//     const checkConnection = async () => {
//       try {
//         const response = await fetch(
//           "https://commons.wikimedia.org/wiki/File:1x1.png",
//           { cache: "no-store", mode: "no-cors" }
//         );
//         if (response.status >= 200 && response.status < 300) {
//           setIsOnline(true);
//         } else {
//           setIsOnline(false);
//         }
//       } catch (error) {
//         setIsOnline(false);
//       }
//     };


//     checkConnection();


//     const intervalId = setInterval(checkConnection, interval);


//     return () => clearInterval(intervalId);
//   }, [interval]);

//   return isOnline;
// };



import { useEffect, useState } from "react";

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);

  useEffect(() => {
    // create event handler
    const handleStatusChange = () => {
      setOnline(navigator.onLine);
    };

    // listen for online and ofline event
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    // clean up to avoid memory-leak
    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  return online;
};
