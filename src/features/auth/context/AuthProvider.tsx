import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { UsuarioActual } from '@/types/usuario'
import type { CredencialesLogin } from '../lib/validacionLogin'
import * as auth from '../services/auth.service'
import { AuthContext } from './AuthContext'

// Guarda la sesión del usuario para toda la aplicación.
// Con Supabase Auth, el estado inicial saldrá de `supabase.auth.getSession()`
// y de `onAuthStateChange`; el resto de la app no cambia.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(() => auth.sesionGuardada())

  const iniciarSesion = useCallback(async (credenciales: CredencialesLogin) => {
    const encontrado = await auth.iniciarSesion(credenciales)
    setUsuario(encontrado)
    return encontrado
  }, [])

  const cerrarSesion = useCallback(async () => {
    await auth.cerrarSesion()
    setUsuario(null)
  }, [])

  const valor = useMemo(() => ({ usuario, iniciarSesion, cerrarSesion }), [usuario, iniciarSesion, cerrarSesion])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
