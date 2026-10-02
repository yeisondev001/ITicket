import type { Rol } from '../types/usuario'

export interface ItemNavegacion {
  id: string
  etiqueta: string
  ruta: string
  seccion: 'principal' | 'inferior'
  // Roles que ven la opción. La lógica de permisos real llega con el login (Sprint 2).
  roles: Rol[]
}

const TODOS: Rol[] = ['usuario', 'tecnico', 'supervisor', 'administrador']

export const NAVEGACION: ItemNavegacion[] = [
  { id: 'inicio', etiqueta: 'Inicio', ruta: '/', seccion: 'principal', roles: TODOS },
  { id: 'tickets', etiqueta: 'Tickets', ruta: '/tickets', seccion: 'principal', roles: ['tecnico', 'supervisor', 'administrador'] },
  { id: 'mis-tickets', etiqueta: 'Mis tickets', ruta: '/mis-tickets', seccion: 'principal', roles: ['usuario', 'tecnico'] },
  { id: 'dashboard', etiqueta: 'Dashboard', ruta: '/dashboard', seccion: 'principal', roles: ['tecnico', 'supervisor', 'administrador'] },
  { id: 'reportes', etiqueta: 'Reportes', ruta: '/reportes', seccion: 'principal', roles: ['supervisor'] },
  { id: 'usuarios', etiqueta: 'Usuarios', ruta: '/usuarios', seccion: 'principal', roles: ['administrador'] },
  { id: 'configuracion', etiqueta: 'Configuración', ruta: '/configuracion', seccion: 'inferior', roles: ['administrador'] },
  { id: 'perfil', etiqueta: 'Perfil', ruta: '/perfil', seccion: 'inferior', roles: TODOS },
]

export function navegacionPorRol(rol: Rol, seccion: ItemNavegacion['seccion']): ItemNavegacion[] {
  return NAVEGACION.filter((item) => item.seccion === seccion && item.roles.includes(rol))
}
