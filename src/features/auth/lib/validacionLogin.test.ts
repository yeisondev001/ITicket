import { describe, expect, it } from 'vitest'
import { validarLogin } from './validacionLogin'

describe('validarLogin', () => {
  it('acepta un correo y una contraseña', () => {
    expect(validarLogin({ correo: 'tecnico@iticket.dev', contrasena: 'secreta' })).toEqual({})
  })

  it('pide el correo y la contraseña', () => {
    const errores = validarLogin({ correo: '', contrasena: '' })
    expect(errores.correo).toBeDefined()
    expect(errores.contrasena).toBeDefined()
  })

  it('rechaza correos mal escritos', () => {
    expect(validarLogin({ correo: 'tecnico@iticket', contrasena: 'x' }).correo).toBeDefined()
    expect(validarLogin({ correo: 'tecnico iticket.dev', contrasena: 'x' }).correo).toBeDefined()
  })

  it('ignora espacios alrededor del correo', () => {
    expect(validarLogin({ correo: '  tecnico@iticket.dev ', contrasena: 'x' }).correo).toBeUndefined()
  })
})
