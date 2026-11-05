import { describe, expect, it } from 'vitest'
import { CONTRASENA_DEMO } from '../data/cuentas.mock'
import { CUENTAS_PRUEBA_SUPABASE, cuentasDePrueba } from './cuentasPrueba'

describe('cuentasDePrueba', () => {
  it('en modo demo muestra las cuentas simuladas con su contraseña', () => {
    const r = cuentasDePrueba({ usaSupabase: false, desarrollo: false })
    expect(r.visible).toBe(true)
    expect(r.contrasena).toBe(CONTRASENA_DEMO)
    expect(r.cuentas.length).toBeGreaterThan(0)
  })

  it('con Supabase en desarrollo muestra una cuenta por rol y la contraseña de .env.local', () => {
    const r = cuentasDePrueba({
      usaSupabase: true,
      desarrollo: true,
      contrasenaLocal: ' clave-local ',
      cuentasSupabase: CUENTAS_PRUEBA_SUPABASE,
    })
    expect(r.visible).toBe(true)
    expect(r.cuentas).toEqual(CUENTAS_PRUEBA_SUPABASE)
    expect(r.cuentas.map((c) => c.rol)).toEqual(['usuario', 'tecnico', 'supervisor', 'administrador'])
    expect(r.contrasena).toBe('clave-local')
  })

  it('si la contraseña no está en .env.local, muestra los correos sin contraseña', () => {
    expect(cuentasDePrueba({ usaSupabase: true, desarrollo: true }).contrasena).toBeNull()
    expect(cuentasDePrueba({ usaSupabase: true, desarrollo: true, contrasenaLocal: '   ' }).contrasena).toBeNull()
  })

  it('en la versión publicada con Supabase no muestra ninguna cuenta', () => {
    const r = cuentasDePrueba({ usaSupabase: true, desarrollo: false, contrasenaLocal: 'no-debe-salir' })
    expect(r).toEqual({ visible: false, cuentas: [], contrasena: null })
  })
})
