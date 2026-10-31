import type {
  ActividadTicket,
  CategoriaNombre,
  Impacto,
  PersonaResumen,
  ServicioDetalle,
  Ticket,
  TicketEstado,
  TicketOrigen,
  TicketPrioridad,
  Urgencia,
} from '../types/ticket.types'

// Traduce las filas de Supabase (snake_case) a los tipos de la interfaz (camelCase).

// Las relaciones de PostgREST llegan como objeto o, según el esquema, como arreglo.
type Relacion<T> = T | T[] | null

export interface FilaTicket {
  id: number
  titulo: string
  descripcion: string
  origen: TicketOrigen
  alerta_id: string | null
  estado: TicketEstado
  impacto: Impacto | null
  urgencia: Urgencia | null
  prioridad: TicketPrioridad | null
  requiere_revision: boolean
  sla_vence_en: string | null
  nivel_escalamiento: number
  solucion: string | null
  created_at: string
  asignado_en: string | null
  resuelto_en: string | null
  cerrado_en: string | null
  updated_at: string
  categoria: Relacion<{ nombre: string }>
  creador: Relacion<PersonaResumen>
  asignado: Relacion<PersonaResumen>
}

export interface FilaComentario {
  id: number
  ticket_id: number
  contenido: string
  created_at: string
  autor: Relacion<{ nombre: string }>
}

export interface FilaPlaybook {
    id: number
    servicio_id: number
    titulo: string
    pasos: string
    updated_at: string
}
export interface FilaServicio {
    id: number
    nombre: string
    descripcion: string | null
    es_critico: boolean
    rto_minutos: number
    rpo_minutos: number
    playbook: Relacion<FilaPlaybook>
}

// Columnas que pide el servicio. Los nombres de las llaves foráneas indican
// cuál de las dos relaciones con perfiles se quiere.
export const COLUMNAS_TICKET = `
  id, titulo, descripcion, origen, alerta_id, estado, impacto, urgencia, prioridad,
  requiere_revision, sla_vence_en, nivel_escalamiento, solucion,
  created_at, asignado_en, resuelto_en, cerrado_en, updated_at,
  categoria:categorias(nombre),
  creador:perfiles!tickets_creado_por_fkey(id, nombre),
  asignado:perfiles!tickets_asignado_a_fkey(id, nombre)
`

export const COLUMNAS_SERVICIO = `
  id,
  nombre,
  descripcion,
  es_critico,
  rto_minutos,
  rpo_minutos,
  playbook:playbooks(
    id,
    servicio_id,
    titulo,
    pasos,
    updated_at
  )
`

function una<T>(relacion: Relacion<T>): T | null {
  if (Array.isArray(relacion)) return relacion[0] ?? null
  return relacion ?? null
}

export function mapearTicket(fila: FilaTicket): Ticket {
  const creador = una(fila.creador)
  const asignado = una(fila.asignado)
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    origen: fila.origen,
    alertaId: fila.alerta_id,
    estado: fila.estado,
    categoria: (una(fila.categoria)?.nombre as CategoriaNombre | undefined) ?? null,
    servicio: null, // el catálogo de servicios llega con la tarea #23
    creadoPor: creador ? { id: creador.id, nombre: creador.nombre } : null,
    asignadoA: asignado ? { id: asignado.id, nombre: asignado.nombre } : null,
    impacto: fila.impacto,
    urgencia: fila.urgencia,
    prioridad: fila.prioridad,
    requiereRevision: fila.requiere_revision,
    slaVenceEn: fila.sla_vence_en,
    nivelEscalamiento: fila.nivel_escalamiento,
    solucion: fila.solucion,
    createdAt: fila.created_at,
    asignadoEn: fila.asignado_en,
    resueltoEn: fila.resuelto_en,
    cerradoEn: fila.cerrado_en,
    updatedAt: fila.updated_at,
  }
}

export function mapearServicio(fila: FilaServicio): ServicioDetalle {
    const playbook = una(fila.playbook)

    return {
        resumen: {
            id: fila.id,
            nombre: fila.nombre,
            esCritico: fila.es_critico
        },
        descripcion: fila.descripcion,
        rtoMinutos: fila.rto_minutos,
        rpoMinutos: fila.rpo_minutos,
        playbook: playbook
            ? {
                id: playbook.id,
                servicioId: playbook.servicio_id,
                titulo: playbook.titulo,
                pasos: playbook.pasos,
                updatedAt: playbook.updated_at,
            }
            : null,
    }
}

// Historial del ticket a partir de sus fechas y comentarios. La bitácora
// completa de cambios llega con la tarea #24.
export function armarActividad(ticket: Ticket, comentarios: FilaComentario[]): ActividadTicket[] {
  const actividad: ActividadTicket[] = [
    {
      id: `${ticket.id}-creado`,
      ticketId: ticket.id,
      tipo: 'creado',
      autor: ticket.creadoPor?.nombre ?? 'Monitoreo',
      descripcion: 'creó el ticket',
      createdAt: ticket.createdAt,
    },
  ]
  if (ticket.asignadoA && ticket.asignadoEn) {
    actividad.push({
      id: `${ticket.id}-asignado`,
      ticketId: ticket.id,
      tipo: 'asignado',
      autor: ticket.asignadoA.nombre,
      descripcion: 'quedó asignado al ticket',
      createdAt: ticket.asignadoEn,
    })
  }
  for (const c of comentarios) {
    actividad.push({
      id: `${ticket.id}-c${c.id}`,
      ticketId: ticket.id,
      tipo: 'comentario',
      autor: una(c.autor)?.nombre ?? 'Usuario',
      descripcion: 'comentó',
      comentario: c.contenido,
      createdAt: c.created_at,
    })
  }
  if (ticket.resueltoEn) {
    actividad.push({
      id: `${ticket.id}-resuelto`,
      ticketId: ticket.id,
      tipo: 'resuelto',
      autor: ticket.asignadoA?.nombre ?? 'Soporte',
      descripcion: 'lo marcó como resuelto',
      comentario: ticket.solucion ?? undefined,
      createdAt: ticket.resueltoEn,
    })
  }
  return actividad.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
