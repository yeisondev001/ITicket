import { createContext } from 'react'
import type { UsuarioActual } from '@/types/usuario'
import type { CredencialesLogin } from '../lib/validacionLogin'

export interface AuthContextValor {
  usuario: UsuarioActual | null
  cargando: boolean
  iniciarSesion: (credenciales: CredencialesLogin) => Promise<UsuarioActual>
  cerrarSesion: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValor | null>(null)
