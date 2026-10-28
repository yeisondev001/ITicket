// Mismos valores que el enum rol_usuario de la base de datos
// (supabase/migrations/20261001215725_remote_schema.sql).
export const ROLES = ['usuario', 'tecnico', 'supervisor', 'administrador'] as const
export type Rol = (typeof ROLES)[number]

// El rol llega de la base de datos como texto: solo se aceptan los cuatro conocidos.
export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor)
}

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
