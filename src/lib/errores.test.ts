import { describe, expect, it } from 'vitest'
import { mensajeDeError } from './errores'

describe('mensajeDeError', () => {
  it('explica cuando RLS rechaza la acción', () => {
    expect(mensajeDeError({ code: '42501', message: 'new row violates row-level security policy' })).toBe(
      'Tu rol no tiene permiso para hacer esta acción.',
    )
  })

  it('muestra el mensaje de los triggers tal cual', () => {
    expect(mensajeDeError({ code: 'P0001', message: 'El tecnico solo puede cambiar estado y solucion' })).toBe(
      'El tecnico solo puede cambiar estado y solucion',
    )
  })

  it('reconoce la falta de conexión', () => {
    expect(mensajeDeError({ message: 'TypeError: Failed to fetch' })).toBe(
      'No hay conexión con el servidor. Intenta de nuevo.',
    )
  })

  it('no muestra detalles técnicos de errores desconocidos', () => {
    expect(mensajeDeError({ code: 'XX000', message: 'internal error at line 42' })).toBe('Ocurrió un error inesperado.')
    expect(mensajeDeError(null)).toBe('Ocurrió un error inesperado.')
  })
})
