import { describe, expect, it } from 'vitest'
import { calcularSla, formatoDuracion } from './sla'

const HORA = 3_600_000
const inicio = Date.UTC(2026, 9, 11, 10, 0, 0)
const iso = (ms: number) => new Date(ms).toISOString()
// Ticket P1: una hora de SLA.
const base = { createdAt: iso(inicio), slaVenceEn: iso(inicio + HORA), resueltoEn: null, cerradoEn: null }

describe('calcularSla', () => {
  it('está dentro del SLA al principio', () => {
    const sla = calcularSla(base, inicio + 0.3 * HORA)
    expect(sla.estado).toBe('dentro')
    expect(sla.porcentajeUsado).toBe(30)
  })

  it('avisa cuando se usó el 75 % o más del tiempo', () => {
    expect(calcularSla(base, inicio + 0.74 * HORA).estado).toBe('dentro')
    expect(calcularSla(base, inicio + 0.75 * HORA).estado).toBe('proximo')
  })

  it('marca vencido cuando pasa la hora límite', () => {
    const sla = calcularSla(base, inicio + 1.5 * HORA)
    expect(sla.estado).toBe('vencido')
    expect(sla.restanteMs).toBeLessThan(0)
    expect(sla.porcentajeUsado).toBe(100)
  })

  it('distingue resueltos a tiempo y fuera de tiempo', () => {
    expect(calcularSla({ ...base, resueltoEn: iso(inicio + 0.5 * HORA) }, inicio + 5 * HORA).estado).toBe('cumplido')
    expect(calcularSla({ ...base, resueltoEn: iso(inicio + 2 * HORA) }, inicio + 5 * HORA).estado).toBe('incumplido')
  })

  it('sin fecha de vencimiento no hay SLA', () => {
    expect(calcularSla({ ...base, slaVenceEn: null }, inicio).estado).toBe('sin_sla')
  })
})

describe('formatoDuracion', () => {
  it('formatea horas, minutos y segundos', () => {
    expect(formatoDuracion(4_810_000)).toBe('01:20:10')
    expect(formatoDuracion(0)).toBe('00:00:00')
  })

  it('muestra un signo menos cuando ya venció', () => {
    expect(formatoDuracion(-1_935_000)).toBe('−00:32:15')
  })
})
