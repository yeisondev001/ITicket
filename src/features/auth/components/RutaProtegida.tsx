import { Navigate, Outlet, useLocation } from 'react-router'
import { EstadoCarga } from '@/components/feedback/EstadoCarga'
import { useAuth } from '../context/useAuth'

// Si no hay sesión, manda al login y recuerda a dónde quería ir el usuario.
// Mientras se recupera la sesión guardada no redirige, para no sacar del
// sistema a quien recarga la página.
// Más adelante aquí también se valida el rol de cada ruta.
export function RutaProtegida() {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()
  if (!usuario && cargando) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <EstadoCarga texto="Recuperando tu sesión…" />
      </div>
    )
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }
  return <Outlet />
}
