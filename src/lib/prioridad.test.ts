import { describe, expect, it } from 'vitest'
import { calcularPrioridad, SLA_HORAS } from './prioridad'

describe('calcularPrioridad', () => {
  it('impacto alto + urgencia alta es P1', () => {
    expect(calcularPrioridad('alto', 'alta')).toBe('P1')
  })

  it('impacto bajo + urgencia baja es P4', () => {
    expect(calcularPrioridad('bajo', 'baja')).toBe('P4')
  })

  it('sigue la matriz ITIL en los casos intermedios', () => {
    expect(calcularPrioridad('alto', 'media')).toBe('P2')
    expect(calcularPrioridad('medio', 'media')).toBe('P3')
    expect(calcularPrioridad('bajo', 'alta')).toBe('P3')
  })

  it('un servicio crítico nunca baja de P2', () => {
    expect(calcularPrioridad('bajo', 'baja', { servicioCritico: true })).toBe('P2')
    expect(calcularPrioridad('medio', 'media', { servicioCritico: true })).toBe('P2')
  })

  it('un servicio crítico no rebaja un P1', () => {
    expect(calcularPrioridad('alto', 'alta', { servicioCritico: true })).toBe('P1')
  })
})

describe('SLA_HORAS', () => {
  it('las prioridades más altas tienen menos tiempo de atención', () => {
    expect(SLA_HORAS.P1).toBeLessThan(SLA_HORAS.P2)
    expect(SLA_HORAS.P2).toBeLessThan(SLA_HORAS.P3)
    expect(SLA_HORAS.P3).toBeLessThan(SLA_HORAS.P4)
  })
})
