import { crearServicioSupabase } from './servicios.supabase'
import { supabase } from '@/lib/supabase'
import { ErrorDeSupabaseConfig } from '@/lib/errores'
import type { NuevoServicioInput, ServicioDetalle, ServicioResumen } from '../types/ticket.types'


const remoto = supabase ? crearServicioSupabase(supabase) : null


export async function listarServicios(): Promise<ServicioResumen[]> {

    if (remoto) return remoto.listarServicios()
    return []
}

export async function obtenerServicio(id: number): Promise<ServicioDetalle | null> {
    if (!remoto)  throw new ErrorDeSupabaseConfig('Supabase no está configurado.')

    return remoto.obtenerServicio(id)
}

export async function crearServicio(input: NuevoServicioInput): Promise<ServicioDetalle> {
    if (!remoto) throw new ErrorDeSupabaseConfig('Supabase no está configurado.')

    return remoto.crearServicio(input)
}

export async function actualizarServicio(id: number, cambios: Record<string, unknown>): Promise<ServicioDetalle> {
    if (!remoto) throw new ErrorDeSupabaseConfig('Supabase no está configurado.')

    return remoto.actualizarServicio(id, cambios)
}

export async function eliminarServicio(id: number): Promise<void> {
    if (!remoto) throw new ErrorDeSupabaseConfig('Supabase no está configurado.')

    return remoto.eliminarServicio(id)
}

