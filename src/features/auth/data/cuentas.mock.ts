import type { UsuarioActual } from '@/types/usuario'

// Cuentas de prueba, una por rol. Solo existen mientras no esté Supabase Auth.
export const CONTRASENA_DEMO = 'iticket123'

export const CUENTAS_DEMO: (UsuarioActual & { correo: string })[] = [
  { id: 'mock-usuario-1', nombre: 'María López', rol: 'usuario', correo: 'usuario@iticket.dev' },
  { id: 'mock-tecnico-1', nombre: 'Starlyn', rol: 'tecnico', correo: 'tecnico@iticket.dev' },
  { id: 'mock-supervisor-1', nombre: 'Laura Méndez', rol: 'supervisor', correo: 'supervisor@iticket.dev' },
  { id: 'mock-admin-1', nombre: 'Admin ITicket', rol: 'administrador', correo: 'admin@iticket.dev' },
]
