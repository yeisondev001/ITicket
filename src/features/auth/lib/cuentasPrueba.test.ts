import { describe, expect, it } from 'vitest'
import { CUENTAS_PRUEBA_SUPABASE, cuentasDePrueba } from './cuentasPrueba'

describe('cuentasDePrueba', () => {
  it('en modo demo muestra las cuentas simuladas', () => {
    const r = cuentasDePrueba({ usaSupabase: false, desarrollo: false })
    expect(r.visible).toBe(true)
    expect(r.cuentas.length).toBeGreaterThan(0)
  })

  it('con Supabase en desarrollo muestra una cuenta por rol', () => {
    const r = cuentasDePrueba({ usaSupabase: true, desarrollo: true, cuentasSupabase: CUENTAS_PRUEBA_SUPABASE })
    expect(r.visible).toBe(true)
    expect(r.cuentas).toEqual(CUENTAS_PRUEBA_SUPABASE)
    expect(r.cuentas.map((c) => c.rol)).toEqual(['usuario', 'tecnico', 'supervisor', 'administrador'])
  })

  it('en la versión publicada con Supabase no muestra ninguna cuenta', () => {
    const r = cuentasDePrueba({ usaSupabase: true, desarrollo: false, cuentasSupabase: CUENTAS_PRUEBA_SUPABASE })
    expect(r).toEqual({ visible: false, cuentas: [] })
  })
})
