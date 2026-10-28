import { describe, expect, it } from 'vitest'
import { armarActividad, mapearTicket, type FilaTicket } from './mapeo'

const fila: FilaTicket = {
  id: 7,
  titulo: 'Impresora sin papel',
  descripcion: 'No imprime',
  origen: 'usuario',
  alerta_id: null,
  estado: 'asignado',
  impacto: 'medio',
  urgencia: 'alta',
  prioridad: 'P2',
  requiere_revision: false,
  sla_vence_en: '2026-10-15T20:00:00Z',
  nivel_escalamiento: 0,
  solucion: null,
  created_at: '2026-10-15T10:00:00Z',
  asignado_en: '2026-10-15T10:30:00Z',
  resuelto_en: null,
  cerrado_en: null,
  updated_at: '2026-10-15T10:30:00Z',
  categoria: { nombre: 'hardware' },
  creador: { id: 'u1', nombre: 'María' },
  asignado: [{ id: 't1', nombre: 'Starlyn' }],
}

describe('mapearTicket', () => {
  it('traduce las columnas de snake_case a camelCase sin perder datos', () => {
    const t = mapearTicket(fila)
    expect(t).toMatchObject({
      id: 7,
      alertaId: null,
      requiereRevision: false,
      slaVenceEn: '2026-10-15T20:00:00Z',
      nivelEscalamiento: 0,
      createdAt: '2026-10-15T10:00:00Z',
      asignadoEn: '2026-10-15T10:30:00Z',
      updatedAt: '2026-10-15T10:30:00Z',
      prioridad: 'P2',
    })
  })

  it('aplana las relaciones con categorías y perfiles, lleguen como objeto o como arreglo', () => {
    const t = mapearTicket(fila)
    expect(t.categoria).toBe('hardware')
    expect(t.creadoPor).toEqual({ id: 'u1', nombre: 'María' })
    expect(t.asignadoA).toEqual({ id: 't1', nombre: 'Starlyn' })
  })

  it('deja en null las relaciones vacías (ticket del monitoreo, sin técnico ni categoría)', () => {
    const t = mapearTicket({ ...fila, origen: 'monitoreo', categoria: null, creador: null, asignado: [] })
    expect(t.categoria).toBeNull()
    expect(t.creadoPor).toBeNull()
    expect(t.asignadoA).toBeNull()
    expect(t.servicio).toBeNull()
  })
})

describe('armarActividad', () => {
  it('ordena creación, asignación y comentarios por fecha', () => {
    const ticket = mapearTicket(fila)
    const actividad = armarActividad(ticket, [
      { id: 1, ticket_id: 7, contenido: 'Ya voy', created_at: '2026-10-15T11:00:00Z', autor: { nombre: 'Starlyn' } },
    ])
    expect(actividad.map((a) => a.tipo)).toEqual(['creado', 'asignado', 'comentario'])
    expect(actividad[2]).toMatchObject({ autor: 'Starlyn', comentario: 'Ya voy' })
  })
})
