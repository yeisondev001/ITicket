import { describe, expect, it } from 'vitest'
import { saludoSegunHora } from './saludo'

const a = (hora: number) => new Date(2026, 9, 2, hora)

describe('saludoSegunHora', () => {
  it('saluda según la franja del día', () => {
    expect(saludoSegunHora(a(5))).toBe('Buenos días')
    expect(saludoSegunHora(a(11))).toBe('Buenos días')
    expect(saludoSegunHora(a(12))).toBe('Buenas tardes')
    expect(saludoSegunHora(a(18))).toBe('Buenas tardes')
    expect(saludoSegunHora(a(19))).toBe('Buenas noches')
    expect(saludoSegunHora(a(2))).toBe('Buenas noches')
  })
})
