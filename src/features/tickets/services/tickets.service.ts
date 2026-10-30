import { calcularPrioridad, SLA_HORAS } from '@/lib/prioridad'
import { supabase } from '@/lib/supabase'
import {
  actividadInicial,
  CATEGORIAS_POR_TECNICO,
  CLASIFICACIONES_MOCK,
  SERVICIOS_MOCK,
  TICKETS_MOCK,
} from '../data/tickets.mock'
import { ESTADO_ETIQUETA } from '../lib/etiquetas'
import type {
  ActividadTicket,
  CategoriaNombre,
  NuevoTicketInput,
  PersonaResumen,
  ServicioResumen,
  Ticket,
  TicketDetalle,
  TicketEstado,
} from '../types/ticket.types'
import { crearServicioSupabase } from './tickets.supabase'

// Capa de acceso a datos del módulo de tickets.
// Con Supabase configurado (.env.local), cada función usa la consulta real de
// tickets.supabase.ts; sin él, trabaja en memoria con datos de prueba (modo
// demo). Los hooks y las pantallas no cambian.

const remoto = supabase ? crearServicioSupabase(supabase) : null

const LATENCIA_MS = 350

const esperar = () => new Promise<void>((resolver) => setTimeout(resolver, LATENCIA_MS))
const copiar = <T>(valor: T): T => structuredClone(valor)
const ahoraIso = () => new Date().toISOString()

const db = {
  tickets: copiar(TICKETS_MOCK),
  clasificaciones: copiar(CLASIFICACIONES_MOCK),
  actividad: new Map<number, ActividadTicket[]>(TICKETS_MOCK.map((t) => [t.id, actividadInicial(t)])),
  siguienteId: Math.max(...TICKETS_MOCK.map((t) => t.id)) + 1,
}

function buscar(id: number): Ticket {
  const ticket = db.tickets.find((t) => t.id === id)
  if (!ticket) throw new Error(`No existe el ticket ${id}`)
  return ticket
}

function registrar(ticketId: number, evento: Omit<ActividadTicket, 'id' | 'ticketId' | 'createdAt'>) {
  const lista = db.actividad.get(ticketId) ?? []
  lista.push({ ...evento, id: `${ticketId}-${lista.length + 1}-${Date.now()}`, ticketId, createdAt: ahoraIso() })
  db.actividad.set(ticketId, lista)
}

export async function listarTickets(): Promise<Ticket[]> {
  if (remoto) return remoto.listarTickets()
  await esperar()
  return copiar(db.tickets)
}

export async function obtenerTicket(id: number): Promise<TicketDetalle | null> {
  if (remoto) return remoto.obtenerTicket(id)
  await esperar()
  const ticket = db.tickets.find((t) => t.id === id)
  if (!ticket) return null
  return copiar({
    ticket,
    clasificacion: db.clasificaciones.find((c) => c.ticketId === id) ?? null,
    actividad: [...(db.actividad.get(id) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  })
}

export async function categoriasDelTecnico(tecnicoId: string): Promise<CategoriaNombre[]> {
  if (remoto) return remoto.categoriasDelTecnico(tecnicoId)
  await esperar()
  return [...(CATEGORIAS_POR_TECNICO[tecnicoId] ?? [])]
}

export async function listarServicios(): Promise<ServicioResumen[]> {
  if (remoto) return remoto.listarServicios()
  await esperar()
  return copiar(SERVICIOS_MOCK)
}

export async function crearTicket(input: NuevoTicketInput, autor: PersonaResumen): Promise<Ticket> {
  if (remoto) return remoto.crearTicket(input, autor)
  await esperar()
  const ahora = ahoraIso()
  const servicio = SERVICIOS_MOCK.find((s) => s.id === input.servicioId) ?? null
  // La prioridad y el SLA los asigna la clasificación con IA (Sprint 3).
  // Mientras tanto: impacto y urgencia medios, respetando la regla de que un
  // servicio crítico nunca queda por debajo de P2.
  const prioridad = calcularPrioridad('medio', 'media', { servicioCritico: servicio?.esCritico ?? false })
  const ticket: Ticket = {
    id: db.siguienteId++,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion.trim(),
    origen: 'usuario',
    alertaId: null,
    estado: 'nuevo',
    categoria: input.categoria,
    servicio: servicio ? { ...servicio } : null,
    creadoPor: autor,
    asignadoA: null,
    impacto: null,
    urgencia: null,
    prioridad,
    requiereRevision: input.categoria === null,
    slaVenceEn: new Date(Date.now() + SLA_HORAS[prioridad] * 3_600_000).toISOString(),
    nivelEscalamiento: 0,
    solucion: null,
    createdAt: ahora,
    asignadoEn: null,
    resueltoEn: null,
    cerradoEn: null,
    updatedAt: ahora,
  }
  db.tickets.unshift(ticket)
  db.actividad.set(ticket.id, [])
  registrar(ticket.id, { tipo: 'creado', autor: autor.nombre, descripcion: 'creó el ticket' })
  return copiar(ticket)
}

export async function cambiarEstado(
  id: number,
  estado: TicketEstado,
  autor: PersonaResumen,
  solucion?: string,
): Promise<Ticket> {
  if (remoto) return remoto.cambiarEstado(id, estado, autor, solucion)
  await esperar()
  const ticket = buscar(id)
  const ahora = ahoraIso()
  ticket.estado = estado
  ticket.updatedAt = ahora
  if (estado === 'resuelto') {
    ticket.resueltoEn = ahora
    ticket.solucion = solucion?.trim() || ticket.solucion
  }
  if (estado === 'cerrado') ticket.cerradoEn = ahora
  if (estado === 'escalado') ticket.nivelEscalamiento += 1

  if (estado === 'resuelto') {
    registrar(id, { tipo: 'resuelto', autor: autor.nombre, descripcion: 'lo marcó como resuelto', comentario: ticket.solucion ?? undefined })
  } else if (estado === 'escalado') {
    registrar(id, { tipo: 'escalado', autor: autor.nombre, descripcion: 'lo escaló al supervisor' })
  } else {
    registrar(id, { tipo: 'estado', autor: autor.nombre, descripcion: `cambió el estado a ${ESTADO_ETIQUETA[estado]}` })
  }
  return copiar(ticket)
}

export async function agregarComentario(id: number, autor: PersonaResumen, contenido: string): Promise<void> {
  if (remoto) return remoto.agregarComentario(id, autor, contenido)
  await esperar()
  buscar(id)
  registrar(id, { tipo: 'comentario', autor: autor.nombre, descripcion: 'comentó', comentario: contenido.trim() })
}

export async function tomarTicket(id: number, tecnico: PersonaResumen): Promise<Ticket> {
  if (remoto) return remoto.tomarTicket(id, tecnico)
  await esperar()
  const ticket = buscar(id)
  if (ticket.asignadoA) throw new Error('Otro técnico ya tomó este ticket.')
  const ahora = ahoraIso()
  ticket.asignadoA = tecnico
  ticket.asignadoEn = ahora
  ticket.estado = 'asignado'
  ticket.updatedAt = ahora
  registrar(id, { tipo: 'asignado', autor: tecnico.nombre, descripcion: 'tomó el ticket' })
  return copiar(ticket)
}

export async function eliminarTicket(id: number): Promise<void> {
  if (remoto) return remoto.eliminarTicket(id)
  await esperar()
  buscar(id)
  db.tickets = db.tickets.filter((t) => t.id !== id)
  db.clasificaciones = db.clasificaciones.filter((c) => c.ticketId !== id)
  db.actividad.delete(id)
}
