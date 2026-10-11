import {
  ChartLineIcon,
  CircleUserIcon,
  FileChartColumnIcon,
  HouseIcon,
  ListTodoIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Rol } from '@/types/usuario'

export interface ItemNavegacion {
  id: string
  etiqueta: string
  ruta: string
  icono: LucideIcon
  seccion: 'principal' | 'inferior'
  // Roles que ven la opción. La lógica de permisos real llega con el login (Sprint 2).
  roles: Rol[]
}

const TODOS: Rol[] = ['usuario', 'tecnico', 'supervisor', 'administrador']

export const NAVEGACION: ItemNavegacion[] = [
  { id: 'inicio', etiqueta: 'Inicio', ruta: '/', icono: HouseIcon, seccion: 'principal', roles: TODOS },
  { id: 'tickets', etiqueta: 'Tickets', ruta: '/tickets', icono: TicketIcon, seccion: 'principal', roles: ['tecnico', 'supervisor', 'administrador'] },
  { id: 'mis-tickets', etiqueta: 'Mis tickets', ruta: '/mis-tickets', icono: ListTodoIcon, seccion: 'principal', roles: ['usuario', 'tecnico'] },
  { id: 'dashboard', etiqueta: 'Dashboard', ruta: '/dashboard', icono: ChartLineIcon, seccion: 'principal', roles: ['tecnico', 'supervisor', 'administrador'] },
  { id: 'reportes', etiqueta: 'Reportes', ruta: '/reportes', icono: FileChartColumnIcon, seccion: 'principal', roles: ['supervisor'] },
  { id: 'usuarios', etiqueta: 'Usuarios', ruta: '/usuarios', icono: UsersIcon, seccion: 'principal', roles: ['administrador'] },
  { id: 'configuracion', etiqueta: 'Configuración', ruta: '/configuracion', icono: SettingsIcon, seccion: 'inferior', roles: ['administrador'] },
  { id: 'perfil', etiqueta: 'Perfil', ruta: '/perfil', icono: CircleUserIcon, seccion: 'inferior', roles: TODOS },
]

export function navegacionPorRol(rol: Rol, seccion: ItemNavegacion['seccion']): ItemNavegacion[] {
  return NAVEGACION.filter((item) => item.seccion === seccion && item.roles.includes(rol))
}
