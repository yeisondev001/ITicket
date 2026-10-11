import type { CategoriaNombre, TicketEstado, TicketOrigen, TicketPrioridad } from '../types/ticket.types'

export const ESTADO_ETIQUETA: Record<TicketEstado, string> = {
  nuevo: 'Nuevo',
  asignado: 'Asignado',
  en_progreso: 'En progreso',
  escalado: 'Escalado',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export const PRIORIDAD_ETIQUETA: Record<TicketPrioridad, string> = {
  P1: 'Crítica',
  P2: 'Alta',
  P3: 'Media',
  P4: 'Baja',
}

export const CATEGORIA_ETIQUETA: Record<CategoriaNombre, string> = {
  red: 'Red',
  hardware: 'Hardware',
  software: 'Software',
  accesos: 'Accesos',
  correo: 'Correo',
  seguridad: 'Seguridad',
  otro: 'Otro',
}

export const ORIGEN_ETIQUETA: Record<TicketOrigen, string> = {
  usuario: 'Formulario',
  monitoreo: 'Monitoreo',
}

export const ESTADOS: TicketEstado[] = ['nuevo', 'asignado', 'en_progreso', 'escalado', 'resuelto', 'cerrado']
export const PRIORIDADES: TicketPrioridad[] = ['P1', 'P2', 'P3', 'P4']
export const CATEGORIAS = Object.keys(CATEGORIA_ETIQUETA) as CategoriaNombre[]

export function codigoTicket(id: number): string {
  return `TCK-${id}`
}

export function estaAbierto(estado: TicketEstado): boolean {
  return estado !== 'resuelto' && estado !== 'cerrado'
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatoFecha(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso))
}
