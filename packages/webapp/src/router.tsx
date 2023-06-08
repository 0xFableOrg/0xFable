import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
    {
        path: '/',
        lazy: () => import("./pages/index"),
    },
    {
        path: '/collection',
        lazy: () => import("./pages/collection"),
    },
    {
        path: '/play',
        lazy: () => import("./pages/play"),
    }
])