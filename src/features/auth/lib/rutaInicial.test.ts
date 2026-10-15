import { describe, expect, it } from 'vitest'
import { rutaInicialPorRol } from './rutaInicial'

describe('rutaInicialPorRol', () => {
  it('lleva al usuario y al técnico a "Mis tickets"', () => {
    expect(rutaInicialPorRol('usuario')).toBe('/mis-tickets')
    expect(rutaInicialPorRol('tecnico')).toBe('/mis-tickets')
  })

  it('lleva al supervisor a la lista completa de tickets', () => {
    expect(rutaInicialPorRol('supervisor')).toBe('/tickets')
  })

  it('lleva al administrador al inicio', () => {
    expect(rutaInicialPorRol('administrador')).toBe('/')
  })
})
