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
    for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
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

  it('el administrador elimina el ticket indicado', async () => {
    const { db, llamadas } = clienteFalso({ tickets: { data: [{ id: 1 }], error: null } })
    await crearServicioSupabase(db).eliminarTicket(1)
    expect(llamadas.some((l) => l.metodo === 'delete')).toBe(true)
    expect(llamadas.find((l) => l.metodo === 'eq')?.args).toEqual(['id', 1])
  })

  it('si RLS no deja borrar (ninguna fila afectada), avisa que no tiene permiso', async () => {
    const { db } = clienteFalso({ tickets: { data: [], error: null } })
    await expect(crearServicioSupabase(db).eliminarTicket(1)).rejects.toThrow(
      'Tu rol no tiene permiso para hacer esta acción.',
    )
  })

  it('lista los tickets más recientes primero, ya convertidos', async () => {
    const { db, llamadas } = clienteFalso({ tickets: { data: [fila], error: null } })
    const tickets = await crearServicioSupabase(db).listarTickets()
    expect(tickets[0]).toMatchObject({ id: 1, categoria: 'red', creadoPor: { id: 'u1', nombre: 'María' } })
    expect(llamadas.find((l) => l.metodo === 'order')?.args).toEqual(['created_at', { ascending: false }])
  })

  it('si la consulta falla, muestra un mensaje claro y no el error técnico', async () => {
    const { db } = clienteFalso({ tickets: { data: null, error: { code: 'XX000', message: 'detalle interno' } } })
    await expect(crearServicioSupabase(db).listarTickets()).rejects.toThrow('Ocurrió un error inesperado.')
  })

  it('el detalle de un ticket que no existe o que RLS oculta es null', async () => {
    const { db } = clienteFalso({ tickets: { data: null, error: null } })
    await expect(crearServicioSupabase(db).obtenerTicket(99)).resolves.toBeNull()
  })

  it('el detalle incluye el historial con los comentarios', async () => {
    const comentario = { id: 5, ticket_id: 1, contenido: 'Revisado', created_at: '2026-10-22T11:00:00Z', autor: { nombre: 'Ana' } }
    const { db } = clienteFalso({
      tickets: { data: fila, error: null },
      comentarios: { data: [comentario], error: null },
    })
    const detalle = await crearServicioSupabase(db).obtenerTicket(1)
    expect(detalle?.clasificacion).toBeNull()
    expect(detalle?.actividad.map((a) => a.tipo)).toEqual(['creado', 'comentario'])
  })

  it('devuelve las categorías que cubre el técnico', async () => {
    const { db } = clienteFalso({
      tecnico_categorias: {
        data: [{ categoria: { nombre: 'red' } }, { categoria: { nombre: 'hardware' } }, { categoria: null }],
        error: null,
      },
    })
    await expect(crearServicioSupabase(db).categoriasDelTecnico('t1')).resolves.toEqual(['red', 'hardware'])
  })

  it('al cerrar guarda la fecha de cierre', async () => {
    const { db, llamadas } = clienteFalso({ tickets: { data: { ...fila, estado: 'cerrado' }, error: null } })
    await crearServicioSupabase(db).cambiarEstado(1, 'cerrado', { id: 't1', nombre: 'Starlyn' })
    const cambios = llamadas.find((l) => l.metodo === 'update')?.args[0] as Record<string, unknown>
    expect(cambios.estado).toBe('cerrado')
    expect(typeof cambios.cerrado_en).toBe('string')
  })

  it('comenta a nombre del autor, con el texto limpio', async () => {
    const { db, llamadas } = clienteFalso({ comentarios: { data: null, error: null } })
    await crearServicioSupabase(db).agregarComentario(1, { id: 't1', nombre: 'Starlyn' }, '  Voy en camino ')
    expect(llamadas.find((l) => l.metodo === 'insert')?.args[0]).toEqual({
      ticket_id: 1,
      autor_id: 't1',
      contenido: 'Voy en camino',
    })
  })

  it('tomar un ticket lo asigna al técnico y guarda la fecha', async () => {
    const { db, llamadas } = clienteFalso({ tickets: { data: fila, error: null } })
    await crearServicioSupabase(db).tomarTicket(1, { id: 't1', nombre: 'Starlyn' })
    const cambios = llamadas.find((l) => l.metodo === 'update')?.args[0] as Record<string, unknown>
    expect(cambios).toMatchObject({ asignado_a: 't1', estado: 'asignado' })
    expect(typeof cambios.asignado_en).toBe('string')
  })
})
