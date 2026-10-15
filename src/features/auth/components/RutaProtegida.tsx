import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/useAuth'

// Si no hay sesión, manda al login y recuerda a dónde quería ir el usuario.
// Más adelante aquí también se valida el rol de cada ruta.
export function RutaProtegida() {
  const { usuario } = useAuth()
  const ubicacion = useLocation()
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }
  return <Outlet />
}
