import type { SupabaseClient } from '@supabase/supabase-js'
import { ErrorDeDatos } from '@/lib/errores'
import type {
  NuevoServicioInput,
  ServicioDetalle,
  ServicioResumen,
} from '../types/ticket.types'
import { COLUMNAS_SERVICIO, mapearServicio, type FilaPlaybook, type FilaServicio } from '../lib/mapeo'

// Acceso real a los datos de servicios. Cada consulta pasa por las políticas
// RLS: cada rol recibe solo las filas que le corresponden.

export function crearServicioSupabase(db: SupabaseClient) {

  async function listarServicios(): Promise<ServicioResumen[]> {
    const { data, error } = await db
      .from('servicios')
      .select('id, nombre, es_critico')
      .order('nombre', { ascending: true })

    if (error) throw new ErrorDeDatos(error)

    return (data as unknown as { id: number; nombre: string; es_critico: boolean }[]).map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      esCritico: fila.es_critico,
    }))
  }

  async function obtenerServicio(id: number): Promise<ServicioDetalle | null> {
    const { data, error } = await db.from('servicios').select(COLUMNAS_SERVICIO).eq('id', id).maybeSingle()

    if (error) throw new ErrorDeDatos(error)
    if (!data) return null

    return mapearServicio(data as unknown as FilaServicio)
  }

  async function actualizarServicio(id: number, cambios: Record<string, unknown>): Promise<ServicioDetalle> {
    const { data, error } = await db
      .from('servicios')
      .update(cambios)
      .eq('id', id)
      .select(COLUMNAS_SERVICIO)
      .single()

    if (error) throw new ErrorDeDatos(error)

    return mapearServicio(data as unknown as FilaServicio)
  }

  async function crearServicio(input: NuevoServicioInput): Promise<ServicioDetalle> {
    if (!input.playbook) throw new Error('El servicio debe tener un playbook.')

    const { data, error } = await db.rpc('crear_servicio_con_playbook', {
      p_nombre: input.nombre,
      p_descripcion: input.descripcion,
      p_es_critico: input.esCritico,
      p_rto_minutos: input.rtoMinutos,
      p_rpo_minutos: input.rpoMinutos,
      p_titulo_playbook: input.playbook.titulo,
      p_pasos_playbook: input.playbook.pasos,
    })

    if (error) throw new ErrorDeDatos(error)

    const resultado = data as unknown as {
      servicio: Omit<FilaServicio, 'playbook'>
      playbook: FilaPlaybook
    }

    return mapearServicio({ ...resultado.servicio, playbook: resultado.playbook })
  }

  async function eliminarServicio(id: number): Promise<void> {
    const { error } = await db.from('servicios').delete().eq('id', id)

    if (error) throw new ErrorDeDatos(error)
  }

  return {
    listarServicios,
    obtenerServicio,
    actualizarServicio,
    crearServicio,
    eliminarServicio,
  }
}
