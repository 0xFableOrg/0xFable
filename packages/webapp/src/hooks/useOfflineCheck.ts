import { useEffect, useState } from "react"

import { toast } from "sonner"

function useOfflineCheck() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    useEffect(() => {
        if (!isOnline) {
            toast.error("App is offline. Please check your internet connection.", {
                dismissible: false,
                duration: Infinity,
            })
        } else {
            toast.dismiss()
        }
    }, [isOnline])
}

export default useOfflineCheck
