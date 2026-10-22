import { beforeEach, describe, expect, it, vi } from 'vitest'

// Login contra Supabase con un cliente simulado: no hace falta red ni usuarios reales.
const auth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}
let perfil: { data: unknown; error: unknown } = { data: null, error: null }
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ maybeSingle: async () => perfil }) }),
}))

vi.mock('@/lib/supabase', () => ({ supabase: { auth, from }, usaSupabase: true }))

const { iniciarSesion, restaurarSesion, cerrarSesion, CredencialesInvalidasError, CuentaSinAccesoError } =
  await import('./auth.service')

const credenciales = { correo: '  Tecnico@ITicket.dev ', contrasena: 'secreta' }

beforeEach(() => {
  vi.clearAllMocks()
  perfil = { data: { id: 'u1', nombre: 'Starlyn', rol: 'tecnico', activo: true }, error: null }
  auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
})

describe('iniciarSesion con Supabase', () => {
  it('envía el correo normalizado y devuelve nombre y rol desde perfiles', async () => {
    const usuario = await iniciarSesion(credenciales)
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'tecnico@iticket.dev', password: 'secreta' })
    expect(from).toHaveBeenCalledWith('perfiles')
    expect(usuario).toEqual({ id: 'u1', nombre: 'Starlyn', rol: 'tecnico' })
  })

  it('da el mensaje genérico si Supabase rechaza las credenciales', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { status: 400, message: 'Invalid login credentials' } })
    await expect(iniciarSesion(credenciales)).rejects.toBeInstanceOf(CredencialesInvalidasError)
  })

  it('avisa de falta de conexión si el servidor falla', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { status: 503, message: 'down' } })
    await expect(iniciarSesion(credenciales)).rejects.toThrow('No hay conexión con el servidor.')
  })

  it('cierra la sesión si la cuenta está desactivada', async () => {
    perfil = { data: { id: 'u1', nombre: 'Starlyn', rol: 'tecnico', activo: false }, error: null }
    await expect(iniciarSesion(credenciales)).rejects.toBeInstanceOf(CuentaSinAccesoError)
    expect(auth.signOut).toHaveBeenCalled()
  })

  it('cierra la sesión si el usuario no tiene perfil', async () => {
    perfil = { data: null, error: null }
    await expect(iniciarSesion(credenciales)).rejects.toBeInstanceOf(CuentaSinAccesoError)
    expect(auth.signOut).toHaveBeenCalled()
  })
})

describe('sesión con Supabase', () => {
  it('recupera el usuario al recargar si hay sesión', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    await expect(restaurarSesion()).resolves.toEqual({ id: 'u1', nombre: 'Starlyn', rol: 'tecnico' })
  })

  it('no hay usuario si no hay sesión', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } })
    await expect(restaurarSesion()).resolves.toBeNull()
  })

  it('cerrar sesión llama a Supabase', async () => {
    await cerrarSesion()
    expect(auth.signOut).toHaveBeenCalled()
  })
})
