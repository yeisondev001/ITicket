import type { UsuarioActual } from '../types/usuario'

// Mock temporal. Cuando exista el login, este hook leerá la sesión de
// Supabase Auth y el perfil del usuario; los componentes no cambian.
const USUARIO_MOCK: UsuarioActual = {
  id: 'mock-tecnico-1',
  nombre: 'Starlyn',
  rol: 'tecnico',
}

export function useUsuarioActual(): UsuarioActual {
  return USUARIO_MOCK
}
