import { useAuth } from '@/features/auth/context/useAuth'
import type { UsuarioActual } from '@/types/usuario'

// Usuario con sesión iniciada. Solo se usa dentro de rutas protegidas
// (ver RutaProtegida), donde siempre hay sesión.
export function useUsuarioActual(): UsuarioActual {
  const { usuario } = useAuth()
  if (!usuario) throw new Error('useUsuarioActual se usó fuera de una ruta protegida.')
  return usuario
}
