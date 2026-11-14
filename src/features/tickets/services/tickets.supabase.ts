import type { SupabaseClient } from '@supabase/supabase-js'
import { ErrorDeDatos } from '@/lib/errores'
import { armarActividad, COLUMNAS_CLASIFICACION_IA, COLUMNAS_TICKET, mapearTicket, mapearClasificacion, type FilaComentario, type FilaTicket, type FilaClasificacionIA } from '../lib/mapeo'
import type {
  CategoriaNombre,
  NuevoTicketInput,
  PersonaResumen,
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

    const clasificacion = await db
    .from('clasificaciones_ia')
    .select(COLUMNAS_CLASIFICACION_IA)
    .eq('ticket_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

    if (clasificacion.error) {
        throw new ErrorDeDatos(clasificacion.error)
    }

    return {
      ticket,

      clasificacion: clasificacion.data ? mapearClasificacion(clasificacion.data as FilaClasificacionIA) : null, // la tabla clasificaciones_ia llega con la tarea #18

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

  async function crearTicket(input: NuevoTicketInput, _autor: PersonaResumen): Promise<Ticket> {
    const categoriaId = await idDeCategoria(input.categoria)

    const { data, error } = await db.functions.invoke('crear-ticket-con-clasificacion', {
      body: {
        titulo: input.titulo.trim(),
        descripcion: input.descripcion.trim(),
        servicio_id: input.servicioId,
        categoria_id: categoriaId,
      },
    })

    if (error) {
      console.error('Function error:', error)
      throw new ErrorDeDatos(error)
    }

    if (!data?.ticket) {
      throw new Error('La Edge Function no devolvió el ticket creado')
    }

    return data.ticket as Ticket
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
    crearTicket,
    cambiarEstado,
    agregarComentario,
    tomarTicket,
  }
}
