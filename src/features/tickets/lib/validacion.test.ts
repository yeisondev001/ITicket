import { describe, expect, it } from 'vitest'
import { tieneErrores, validarNuevoTicket } from './validacion'

describe('validarNuevoTicket', () => {
  it('acepta un ticket con título y descripción', () => {
    const errores = validarNuevoTicket({ titulo: 'VPN caída', descripcion: 'No conecta', servicioId: null, categoria: null })
    expect(tieneErrores(errores)).toBe(false)
  })

  it('pide un título de al menos 3 caracteres (sin contar espacios)', () => {
    expect(validarNuevoTicket({ titulo: '  ab  ', descripcion: 'x', servicioId: null, categoria: null }).titulo).toBeDefined()
  })

  it('rechaza títulos de más de 200 caracteres', () => {
    expect(validarNuevoTicket({ titulo: 'a'.repeat(201), descripcion: 'x', servicioId: null, categoria: null }).titulo).toBeDefined()
  })

  it('pide la descripción', () => {
    expect(validarNuevoTicket({ titulo: 'Impresora', descripcion: '   ', servicioId: null, categoria: 'hardware' }).descripcion).toBeDefined()
  })
})
