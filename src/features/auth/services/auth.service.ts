import { esRol, type UsuarioActual } from '@/types/usuario'
import { supabase } from '@/lib/supabase'
import { CONTRASENA_DEMO, CUENTAS_DEMO } from '../data/cuentas.mock'
import type { CredencialesLogin } from '../lib/validacionLogin'

// Acceso a la autenticación.
// Con Supabase configurado: Supabase Auth + la tabla perfiles (nombre y rol).
// Sin él (modo demo): cuentas de prueba y sesión en sessionStorage.

const LATENCIA_MS = 500
const CLAVE_SESION = 'iticket.sesion'

export class CredencialesInvalidasError extends Error {
  constructor() {
    super('Correo o contraseña incorrectos.')
    this.name = 'CredencialesInvalidasError'
  }
}

export class CuentaSinAccesoError extends Error {
  constructor() {
    super('Tu cuenta está desactivada o no tiene perfil. Contacta al administrador.')
    this.name = 'CuentaSinAccesoError'
  }
}

const esperar = () => new Promise((resolver) => setTimeout(resolver, LATENCIA_MS))

function guardar(usuario: UsuarioActual | null) {
  try {
    if (usuario) sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario))
    else sessionStorage.removeItem(CLAVE_SESION)
  } catch {
    // Sin acceso al almacenamiento (p. ej. en pruebas): la sesión dura hasta recargar.
  }
}

// Sesión del modo demo, disponible al instante para el primer render.
export function sesionGuardada(): UsuarioActual | null {
  if (supabase) return null
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION)
    return texto ? (JSON.parse(texto) as UsuarioActual) : null
  } catch {
    return null
  }
}

// Perfil activo del usuario de Supabase Auth, o null si no tiene acceso.
async function leerPerfil(id: string): Promise<UsuarioActual | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('perfiles').select('id, nombre, rol, activo').eq('id', id).maybeSingle()
  // Validación de rol aportada por Yahir (PR #58).
  if (error || !data || !data.activo || !esRol(data.rol)) return null
  return { id: data.id, nombre: data.nombre, rol: data.rol }
}

// Recupera la sesión al recargar la página.
export async function restaurarSesion(): Promise<UsuarioActual | null> {
  if (!supabase) return sesionGuardada()
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  return id ? leerPerfil(id) : null
}

export async function iniciarSesion({ correo, contrasena }: CredencialesLogin): Promise<UsuarioActual> {
  const email = correo.trim().toLowerCase()

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: contrasena })
    // El mismo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen.
    if (error || !data.user) {
      if (error && error.status && error.status >= 500) throw new Error('No hay conexión con el servidor. Intenta de nuevo.')
      throw new CredencialesInvalidasError()
    }
    const usuario = await leerPerfil(data.user.id)
    if (!usuario) {
      await supabase.auth.signOut()
      throw new CuentaSinAccesoError()
    }
    return usuario
  }

  await esperar()
  const cuenta = CUENTAS_DEMO.find((c) => c.correo === email)
  if (!cuenta || contrasena !== CONTRASENA_DEMO) throw new CredencialesInvalidasError()
  const usuario: UsuarioActual = { id: cuenta.id, nombre: cuenta.nombre, rol: cuenta.rol }
  guardar(usuario)
  return usuario
}

export async function cerrarSesion(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
  guardar(null)
}
