import type { CategoriaNombre, Ticket, TicketEstado, TicketPrioridad } from '../types/ticket.types'
import { codigoTicket, estaAbierto } from './etiquetas'
import { calcularSla, enRiesgo } from './sla'

export type VistaTickets = 'abiertos' | 'mios' | 'riesgo' | 'todos'

export interface FiltrosTickets {
  busqueda: string
  estado: TicketEstado | 'todos'
  prioridad: TicketPrioridad | 'todas'
  categoria: CategoriaNombre | 'todas'
}

export const FILTROS_INICIALES: FiltrosTickets = {
  busqueda: '',
  estado: 'todos',
  prioridad: 'todas',
  categoria: 'todas',
}

export function cumpleVista(ticket: Ticket, vista: VistaTickets, usuarioId: string, ahora: number): boolean {
  switch (vista) {
    case 'abiertos':
      return estaAbierto(ticket.estado)
    case 'mios':
      return estaAbierto(ticket.estado) && ticket.asignadoA?.id === usuarioId
    case 'riesgo':
      return enRiesgo(calcularSla(ticket, ahora).estado)
    case 'todos':
      return true
  }
}

export function cumpleFiltros(ticket: Ticket, filtros: FiltrosTickets): boolean {
  const texto = filtros.busqueda.trim().toLowerCase()
  if (texto && !`${codigoTicket(ticket.id)} ${ticket.titulo}`.toLowerCase().includes(texto)) return false
  if (filtros.estado !== 'todos' && ticket.estado !== filtros.estado) return false
  if (filtros.prioridad !== 'todas' && ticket.prioridad !== filtros.prioridad) return false
  if (filtros.categoria !== 'todas' && ticket.categoria !== filtros.categoria) return false
  return true
}

// Primero los que vencen antes; los cerrados y sin SLA al final.
export function ordenarPorSla(tickets: Ticket[]): Ticket[] {
  const clave = (t: Ticket) => {
    if (!estaAbierto(t.estado)) return Number.POSITIVE_INFINITY
    return t.slaVenceEn ? Date.parse(t.slaVenceEn) : Number.MAX_SAFE_INTEGER
  }
  return [...tickets].sort((a, b) => clave(a) - clave(b) || b.id - a.id)
}
