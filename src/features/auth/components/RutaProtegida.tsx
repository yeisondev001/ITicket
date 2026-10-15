import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/useAuth'

export function RutaProtegida() {
    const { usuario, cargando } = useAuth()
    const ubicacion = useLocation()

    if (cargando) {
        return (
            <div className="grid min-h-svh place-items-center" role="status">
                Comprobando sesión…
            </div>
        )
    }

    if (!usuario) {
        return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
    }

    return <Outlet />
}