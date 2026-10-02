// Mismos valores que el enum rol_usuario de la base de datos
// (supabase/migrations/20260930120000_tablas_base.sql).
export type Rol = 'usuario' | 'tecnico' | 'supervisor' | 'administrador'

export const ROL_ETIQUETA: Record<Rol, string> = {
  usuario: 'Usuario',
  tecnico: 'Técnico',
  supervisor: 'Supervisor',
  administrador: 'Administrador',
}

// Subconjunto de la tabla perfiles que necesita la interfaz.
export interface UsuarioActual {
  id: string
  nombre: string
  rol: Rol
}
