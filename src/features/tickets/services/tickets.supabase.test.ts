import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { FilaTicket } from '../lib/mapeo'
import { crearServicioSupabase } from './tickets.supabase'

// Cliente simulado: registra lo que el servicio le pide a cada tabla y
// responde con lo que indique cada prueba.
function clienteFalso(respuestas: Record<string, { data: unknown; error: unknown }>) {
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
  return { db: { from } as unknown as SupabaseClient, llamadas }
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
  creador: { id: 'u1', nombre: 'María' },
  asignado: null,
}

describe('servicio de tickets con Supabase', () => {
  it('crea el ticket a nombre del usuario, con la categoría y la prioridad calculada', async () => {
    const { db, llamadas } = clienteFalso({
      categorias: { data: { id: 3 }, error: null },
      tickets: { data: fila, error: null },
    })
    const ticket = await crearServicioSupabase(db).crearTicket(
      { titulo: '  VPN caída ', descripcion: 'No conecta ', servicioId: null, categoria: 'red' },
      { id: 'u1', nombre: 'María' },
    )
    const insert = llamadas.find((l) => l.tabla === 'tickets' && l.metodo === 'insert')?.args[0]
    expect(insert).toMatchObject({
      titulo: 'VPN caída',
      descripcion: 'No conecta',
      origen: 'usuario',
      creado_por: 'u1',
      categoria_id: 3,
      prioridad: 'P3',
      requiere_revision: false,
    })
    expect(ticket.categoria).toBe('red')
  })

  it('marca para revisión el ticket sin categoría', async () => {
    const { db, llamadas } = clienteFalso({ tickets: { data: fila, error: null } })
    await crearServicioSupabase(db).crearTicket(
      { titulo: 'Algo raro', descripcion: 'x', servicioId: null, categoria: null },
      { id: 'u1', nombre: 'María' },
    )
    const insert = llamadas.find((l) => l.metodo === 'insert')?.args[0]
    expect(insert).toMatchObject({ categoria_id: null, requiere_revision: true })
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
