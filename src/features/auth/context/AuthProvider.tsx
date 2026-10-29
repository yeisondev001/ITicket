import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UsuarioActual } from '@/types/usuario'
import type { CredencialesLogin } from '../lib/validacionLogin'
import * as auth from '../services/auth.service'
import { AuthContext } from './AuthContext'

// Guarda la sesión del usuario para toda la aplicación.
// Con Supabase, la sesión se recupera al cargar la página (`cargando` mientras
// tanto); en modo demo está disponible desde el primer render.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(() => auth.sesionGuardada())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    auth
      .restaurarSesion()
      .then((encontrado) => {
        if (activo) setUsuario(encontrado)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const iniciarSesion = useCallback(async (credenciales: CredencialesLogin) => {
    const encontrado = await auth.iniciarSesion(credenciales)
    setUsuario(encontrado)
    return encontrado
  }, [])

  const cerrarSesion = useCallback(async () => {
    await auth.cerrarSesion()
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
