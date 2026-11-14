import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { mapearTicket, type FilaTicket } from '../lib/mapeo'
import { crearServicioSupabase } from './tickets.supabase'

// Cliente simulado: registra lo que el servicio le pide a cada tabla y
// responde con lo que indique cada prueba.
type RespuestaFalsa = { data: unknown; error: unknown }

function clienteFalso(respuestas: Record<string, RespuestaFalsa>) {
  const llamadas: { tabla: string; metodo: string; args: unknown[] }[] = []
  const from = (tabla: string) => {
    const consulta = {
      then: (resolver: (r: unknown) => unknown) => Promise.resolve(respuestas[tabla]).then(resolver),
    } as Record<string, unknown>
    for (const metodo of ['select', 'insert', 'update', 'eq', 'order']) {
      consulta[metodo] = (...args: unknown[]) => {
        llamadas.push({ tabla, metodo, args })
        return consulta
      }
    }
    consulta.single = async () => respuestas[tabla]
    consulta.maybeSingle = async () => respuestas[tabla]
    return consulta
  }
  const functions = {
    invoke: async (...args: unknown[]) => {
      llamadas.push({ tabla: 'crear-ticket-con-clasificacion', metodo: 'invoke', args })
      return respuestas.crearTicket ?? {
        data: {
          ticket: respuestas.tickets?.data
            ? mapearTicket(respuestas.tickets.data as FilaTicket)
            : null,
        },
        error: respuestas.tickets?.error ?? null,
      }
    },
  }

  return { db: { from, functions } as unknown as SupabaseClient, llamadas }
}

const fila: FilaTicket = {
    id: 1,
    titulo: 'VPN caída',
    descripcion: 'No conecta',
    origen: 'usuario',
    alerta_id: null,
    estado: 'nuevo',
    impacto: null,
    urgencia: null,
    prioridad: 'P3',
    requiere_revision: false,
    sla_vence_en: null,
    nivel_escalamiento: 0,
    solucion: null,
    created_at: '2026-10-22T10:00:00Z',
    asignado_en: null,
    resuelto_en: null,
    cerrado_en: null,
    updated_at: '2026-10-22T10:00:00Z',
    categoria: { nombre: 'red' },
    servicio: null,
    creador: { id: 'u1', nombre: 'María' },
    asignado: null,
}

describe('servicio de tickets con Supabase', () => {
  it('crea el ticket a nombre del usuario, con la categoría y la prioridad calculada', async () => {
    const { db, llamadas } = clienteFalso({
      categorias: { data: { id: 3 }, error: null },
      tickets: { data: fila, error: null },
      crearTicket: { data: { ticket: mapearTicket(fila) }, error: null },
    })
    const ticket = await crearServicioSupabase(db).crearTicket(
      { titulo: '  VPN caída ', descripcion: 'No conecta ', servicioId: null, categoria: 'red' },
      { id: 'u1', nombre: 'María' },
    )
    const llamada = llamadas.find((l) => l.metodo === 'invoke')
    expect(llamada?.args[0]).toBe('crear-ticket-con-clasificacion')
    expect(llamada?.args[1]).toEqual({
      body: {
        titulo: 'VPN caída',
        descripcion: 'No conecta',
        servicio_id: null,
        categoria_id: 3,
      },
    })
    expect(ticket.id).toBe(1)
    expect(ticket.categoria).toBe('red')
  })

  it('marca para revisión el ticket sin categoría', async () => {
    const { db, llamadas } = clienteFalso({
      tickets: { data: { ...fila, categoria: null, requiere_revision: true }, error: null },
    })
    const ticket = await crearServicioSupabase(db).crearTicket(
      { titulo: 'Algo raro', descripcion: 'x', servicioId: null, categoria: null },
      { id: 'u1', nombre: 'María' },
    )
    const llamada = llamadas.find((l) => l.metodo === 'invoke')
    expect(llamada?.args[1]).toEqual({
      body: {
        titulo: 'Algo raro',
        descripcion: 'x',
        servicio_id: null,
        categoria_id: null,
      },
    })
    expect(ticket.requiereRevision).toBe(true)
  })

  it('al resolver guarda la solución y la fecha de resolución', async () => {
    const { db, llamadas } = clienteFalso({ tickets: { data: { ...fila, estado: 'resuelto' }, error: null } })
    await crearServicioSupabase(db).cambiarEstado(1, 'resuelto', { id: 't1', nombre: 'Starlyn' }, ' Reinicié el router ')
    const cambios = llamadas.find((l) => l.metodo === 'update')?.args[0] as Record<string, unknown>
    expect(cambios).toMatchObject({ estado: 'resuelto', solucion: 'Reinicié el router' })
    expect(typeof cambios.resuelto_en).toBe('string')
  })

  it('traduce el rechazo de RLS a un mensaje claro', async () => {
    const { db } = clienteFalso({ tickets: { data: null, error: { code: '42501', message: 'row-level security' } } })
    await expect(
      crearServicioSupabase(db).crearTicket(
        { titulo: 'Prueba', descripcion: 'x', servicioId: null, categoria: null },
        { id: 't1', nombre: 'Starlyn' },
      ),
    ).rejects.toThrow('Tu rol no tiene permiso para hacer esta acción.')
  })
})