import type { Impacto, Prioridad, Urgencia } from '@/lib/prioridad'

// Los valores coinciden con los enums de la base de datos
// (supabase/migrations/20260930120000_tablas_base.sql). Los nombres de campo
// están en camelCase; el servicio los traduce desde snake_case.

export type TicketEstado = 'nuevo' | 'asignado' | 'en_progreso' | 'escalado' | 'resuelto' | 'cerrado'
export type TicketOrigen = 'usuario' | 'monitoreo'
export type TicketPrioridad = Prioridad
export type { Impacto, Urgencia }

// Mismos nombres que la tabla categorias.
export type CategoriaNombre = 'red' | 'hardware' | 'software' | 'accesos' | 'correo' | 'seguridad' | 'otro'

// Servicio del catálogo de continuidad (tabla servicios, tarea #23).
export interface ServicioResumen {
  id: number
  nombre: string
  esCritico: boolean
}

export interface ServicioDetalle {
    resumen: ServicioResumen
    descripcion: string | null
    rtoMinutos: number
    rpoMinutos: number
    playbook: Playbook | null
}

export interface NuevoServicioInput {
    nombre: string
    descripcion: string | null
    esCritico: boolean
    rtoMinutos: number
    rpoMinutos: number
    playbook: Playbook | null
}

export interface Playbook {
    id: number
    servicioId: number
    titulo: string | null
    pasos: string 
    updatedAt: string
}

export interface PersonaResumen {
  id: string
  nombre: string
}

export interface Ticket {
  id: number
  titulo: string
  descripcion: string
  origen: TicketOrigen
  alertaId: string | null
  estado: TicketEstado
  categoria: CategoriaNombre | null
  servicio: ServicioResumen | null // tickets.servicio_id
  creadoPor: PersonaResumen | null // null si viene del monitoreo
  asignadoA: PersonaResumen | null
  impacto: Impacto | null
  urgencia: Urgencia | null
  prioridad: TicketPrioridad | null
  requiereRevision: boolean
  slaVenceEn: string | null // fechas en ISO 8601
  nivelEscalamiento: number
  solucion: string | null
  createdAt: string
  asignadoEn: string | null
  resueltoEn: string | null
  cerradoEn: string | null
  updatedAt: string
}

// Una fila de clasificaciones_ia.
export interface ClasificacionIA {
  id: number
  ticketId: number
  modelo: string
  categoria: CategoriaNombre | null
  impacto: Impacto | null
  urgencia: Urgencia | null
  prioridad: TicketPrioridad | null
  confianza: number // 0 a 1
  explicacion: string
  valida: boolean
  createdAt: string
}

export type TipoActividad =
  | 'creado'
  | 'clasificado'
  | 'asignado'
  | 'estado'
  | 'comentario'
  | 'escalado'
  | 'resuelto'

// Evento del historial del ticket. Más adelante sale de comentarios + bitacora.
export interface ActividadTicket {
  id: string
  ticketId: number
  tipo: TipoActividad
  autor: string
  descripcion: string
  comentario?: string
  createdAt: string
}

export interface TicketDetalle {
  ticket: Ticket
  clasificacion: ClasificacionIA | null
  actividad: ActividadTicket[]
}

export interface NuevoTicketInput {
  titulo: string
  descripcion: string
  servicioId: number | null
  categoria: CategoriaNombre | null
}
