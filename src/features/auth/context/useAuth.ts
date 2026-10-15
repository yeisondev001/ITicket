import { useContext } from 'react'
import { AuthContext, type AuthContextValor } from './AuthContext'

export function useAuth(): AuthContextValor {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return valor
}
