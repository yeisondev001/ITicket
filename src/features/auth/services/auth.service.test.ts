import { describe, expect, it } from 'vitest'
import { CONTRASENA_DEMO } from '../data/cuentas.mock'
import { CredencialesInvalidasError, iniciarSesion } from './auth.service'

describe('iniciarSesion', () => {
  it('devuelve el usuario con su rol si las credenciales son correctas', async () => {
    const usuario = await iniciarSesion({ correo: 'supervisor@iticket.dev', contrasena: CONTRASENA_DEMO })
    expect(usuario.rol).toBe('supervisor')
  })

  it('no distingue mayúsculas ni espacios en el correo', async () => {
    const usuario = await iniciarSesion({ correo: '  Tecnico@ITicket.dev ', contrasena: CONTRASENA_DEMO })
    expect(usuario.rol).toBe('tecnico')
  })

  it('da un mensaje claro si la contraseña es incorrecta', async () => {
    await expect(iniciarSesion({ correo: 'tecnico@iticket.dev', contrasena: 'otra' })).rejects.toThrow(
      'Correo o contraseña incorrectos.',
    )
  })

  it('da el mismo mensaje si el correo no existe (no revela qué dato falló)', async () => {
    await expect(iniciarSesion({ correo: 'nadie@iticket.dev', contrasena: CONTRASENA_DEMO })).rejects.toBeInstanceOf(
      CredencialesInvalidasError,
    )
  })
})
