// Mismos valores que el enum rol_usuario de la base de datos.
export const ROLES = ['usuario', 'tecnico', 'supervisor', 'administrador'] as const
export type Rol = (typeof ROLES)[number]

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
