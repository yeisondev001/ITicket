import { describe, expect, it } from 'vitest'
import type { Ticket } from '../types/ticket.types'
import { cumpleFiltros, cumpleVista, FILTROS_INICIALES, ordenarPorSla } from './filtros'

const HORA = 3_600_000
const AHORA = Date.UTC(2026, 9, 11, 12, 0, 0)
const iso = (ms: number) => new Date(ms).toISOString()

function ticket(parcial: Partial<Ticket> & Pick<Ticket, 'id'>): Ticket {
  return {
    titulo: 'Ticket de prueba',
    descripcion: '',
    origen: 'usuario',
    alertaId: null,
    estado: 'asignado',
    categoria: 'red',
    servicio: null,
    creadoPor: { id: 'u1', nombre: 'Usuario' },
    asignadoA: null,
    impacto: null,
    urgencia: null,
    prioridad: 'P3',
    requiereRevision: false,
    slaVenceEn: iso(AHORA + 10 * HORA),
    nivelEscalamiento: 0,
    solucion: null,
    createdAt: iso(AHORA - HORA),
    asignadoEn: null,
    resueltoEn: null,
    cerradoEn: null,
    updatedAt: iso(AHORA),
    ...parcial,
  }
}

describe('cumpleVista', () => {
  const mio = ticket({ id: 1, asignadoA: { id: 'tec', nombre: 'Yo' } })
  const cerrado = ticket({ id: 2, estado: 'cerrado', cerradoEn: iso(AHORA) })
  const vencido = ticket({ id: 3, slaVenceEn: iso(AHORA - 60_000) })

  it('abiertos excluye resueltos y cerrados', () => {
    expect(cumpleVista(mio, 'abiertos', 'tec', AHORA)).toBe(true)
    expect(cumpleVista(cerrado, 'abiertos', 'tec', AHORA)).toBe(false)
  })

  it('mios solo incluye los asignados al usuario', () => {
    expect(cumpleVista(mio, 'mios', 'tec', AHORA)).toBe(true)
    expect(cumpleVista(vencido, 'mios', 'tec', AHORA)).toBe(false)
  })

  it('riesgo incluye los vencidos', () => {
    expect(cumpleVista(vencido, 'riesgo', 'tec', AHORA)).toBe(true)
    expect(cumpleVista(mio, 'riesgo', 'tec', AHORA)).toBe(false)
  })
})

describe('cumpleFiltros', () => {
  const t = ticket({ id: 1042, titulo: 'Servidor de correo caído', prioridad: 'P1', categoria: 'correo' })

  it('busca por código y por título sin importar mayúsculas', () => {
    expect(cumpleFiltros(t, { ...FILTROS_INICIALES, busqueda: 'tck-1042' })).toBe(true)
    expect(cumpleFiltros(t, { ...FILTROS_INICIALES, busqueda: 'CORREO' })).toBe(true)
    expect(cumpleFiltros(t, { ...FILTROS_INICIALES, busqueda: 'impresora' })).toBe(false)
  })

  it('filtra por prioridad y categoría', () => {
    expect(cumpleFiltros(t, { ...FILTROS_INICIALES, prioridad: 'P1', categoria: 'correo' })).toBe(true)
    expect(cumpleFiltros(t, { ...FILTROS_INICIALES, prioridad: 'P2' })).toBe(false)
  })
})

describe('ordenarPorSla', () => {
  it('pone primero el que vence antes y los cerrados al final', () => {
    const tarde = ticket({ id: 1, slaVenceEn: iso(AHORA + 5 * HORA) })
    const pronto = ticket({ id: 2, slaVenceEn: iso(AHORA + HORA) })
    const cerrado = ticket({ id: 3, estado: 'cerrado', slaVenceEn: iso(AHORA) })
    expect(ordenarPorSla([cerrado, tarde, pronto]).map((x) => x.id)).toEqual([2, 1, 3])
  })
})
