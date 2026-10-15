import type { SupabaseClient } from '@supabase/supabase-js'
import { ErrorDeDatos } from '@/lib/errores'
import { calcularPrioridad, SLA_HORAS } from '@/lib/prioridad'
import { armarActividad, COLUMNAS_TICKET, mapearTicket, type FilaComentario, type FilaTicket } from '../lib/mapeo'
import type {
  CategoriaNombre,
  NuevoTicketInput,
  PersonaResumen,
  ServicioResumen,
  Ticket,
  TicketDetalle,
  TicketEstado,
} from '../types/ticket.types'

// Acceso real a los datos de tickets. Cada consulta pasa por las políticas
// RLS: cada rol recibe solo las filas que le corresponden.

export function crearServicioSupabase(db: SupabaseClient) {
  async function idDeCategoria(nombre: CategoriaNombre | null): Promise<number | null> {
    if (!nombre) return null
    const { data, error } = await db.from('categorias').select('id').eq('nombre', nombre).maybeSingle()
    if (error) throw new ErrorDeDatos(error)
    return data?.id ?? null
  }

  async function listarTickets(): Promise<Ticket[]> {
    const { data, error } = await db.from('tickets').select(COLUMNAS_TICKET).order('created_at', { ascending: false })
    if (error) throw new ErrorDeDatos(error)
    return (data as unknown as FilaTicket[]).map(mapearTicket)
  }

  async function obtenerTicket(id: number): Promise<TicketDetalle | null> {
    const { data, error } = await db.from('tickets').select(COLUMNAS_TICKET).eq('id', id).maybeSingle()
    if (error) throw new ErrorDeDatos(error)
    if (!data) return null
    const ticket = mapearTicket(data as unknown as FilaTicket)

    const comentarios = await db
      .from('comentarios')
      .select('id, ticket_id, contenido, created_at, autor:perfiles(nombre)')
      .eq('ticket_id', id)
      .order('created_at')
    if (comentarios.error) throw new ErrorDeDatos(comentarios.error)

    return {
      ticket,
      clasificacion: null, // la tabla clasificaciones_ia llega con la tarea #18
      actividad: armarActividad(ticket, comentarios.data as unknown as FilaComentario[]),
    }
  }

  async function categoriasDelTecnico(tecnicoId: string): Promise<CategoriaNombre[]> {
    const { data, error } = await db.from('tecnico_categorias').select('categoria:categorias(nombre)').eq('tecnico_id', tecnicoId)
    if (error) throw new ErrorDeDatos(error)
    return (data as unknown as { categoria: { nombre: CategoriaNombre } | null }[])
      .map((f) => f.categoria?.nombre)
      .filter((n): n is CategoriaNombre => Boolean(n))
  }

  async function listarServicios(): Promise<ServicioResumen[]> {
    return [] // el catálogo de servicios críticos llega con la tarea #23
  }

  async function crearTicket(input: NuevoTicketInput, autor: PersonaResumen): Promise<Ticket> {
    // La IA estimará impacto y urgencia (Sprint 3). Mientras tanto, prioridad
    // media con la misma regla que usa el modo demo.
    const prioridad = calcularPrioridad('medio', 'media', { servicioCritico: false })
    const { data, error } = await db
      .from('tickets')
      .insert({
        titulo: input.titulo.trim(),
        descripcion: input.descripcion.trim(),
        origen: 'usuario',
        creado_por: autor.id,
        categoria_id: await idDeCategoria(input.categoria),
        prioridad,
        requiere_revision: input.categoria === null,
        sla_vence_en: new Date(Date.now() + SLA_HORAS[prioridad] * 3_600_000).toISOString(),
      })
      .select(COLUMNAS_TICKET)
      .single()
    if (error) throw new ErrorDeDatos(error)
    return mapearTicket(data as unknown as FilaTicket)
  }

  async function actualizar(id: number, cambios: Record<string, unknown>): Promise<Ticket> {
    const { data, error } = await db.from('tickets').update(cambios).eq('id', id).select(COLUMNAS_TICKET).single()
    if (error) throw new ErrorDeDatos(error)
    return mapearTicket(data as unknown as FilaTicket)
  }

  async function cambiarEstado(id: number, estado: TicketEstado, _autor: PersonaResumen, solucion?: string) {
    const ahora = new Date().toISOString()
    const cambios: Record<string, unknown> = { estado }
    if (estado === 'resuelto') {
      cambios.resuelto_en = ahora
      if (solucion?.trim()) cambios.solucion = solucion.trim()
    }
    if (estado === 'cerrado') cambios.cerrado_en = ahora
    return actualizar(id, cambios)
  }

  async function agregarComentario(id: number, autor: PersonaResumen, contenido: string): Promise<void> {
    const { error } = await db.from('comentarios').insert({ ticket_id: id, autor_id: autor.id, contenido: contenido.trim() })
    if (error) throw new ErrorDeDatos(error)
  }

  async function tomarTicket(id: number, tecnico: PersonaResumen): Promise<Ticket> {
    return actualizar(id, { asignado_a: tecnico.id, asignado_en: new Date().toISOString(), estado: 'asignado' })
  }

  return {
    listarTickets,
    obtenerTicket,
    categoriasDelTecnico,
    listarServicios,
    crearTicket,
    cambiarEstado,
    agregarComentario,
    tomarTicket,
  }
}
