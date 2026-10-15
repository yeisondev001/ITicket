import type { UsuarioActual } from '@/types/usuario'
import { CONTRASENA_DEMO, CUENTAS_DEMO } from '../data/cuentas.mock'
import type { CredencialesLogin } from '../lib/validacionLogin'

// Acceso a la autenticación. Hoy valida contra cuentas de prueba y guarda la
// sesión en sessionStorage. Con Supabase Auth:
//   iniciarSesion  → supabase.auth.signInWithPassword() + leer la tabla perfiles
//   cerrarSesion   → supabase.auth.signOut()
//   sesionGuardada → supabase.auth.getSession()

const LATENCIA_MS = 500
const CLAVE_SESION = 'iticket.sesion'

export class CredencialesInvalidasError extends Error {
  constructor() {
    super('Correo o contraseña incorrectos.')
    this.name = 'CredencialesInvalidasError'
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

export function sesionGuardada(): UsuarioActual | null {
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION)
    return texto ? (JSON.parse(texto) as UsuarioActual) : null
  } catch {
    return null
  }
}

export async function iniciarSesion({ correo, contrasena }: CredencialesLogin): Promise<UsuarioActual> {
  await esperar()
  const cuenta = CUENTAS_DEMO.find((c) => c.correo === correo.trim().toLowerCase())
  // El mismo mensaje para correo o contraseña incorrectos: no revela qué cuentas existen.
  if (!cuenta || contrasena !== CONTRASENA_DEMO) throw new CredencialesInvalidasError()
  const usuario: UsuarioActual = { id: cuenta.id, nombre: cuenta.nombre, rol: cuenta.rol }
  guardar(usuario)
  return usuario
}

export async function cerrarSesion(): Promise<void> {
  guardar(null)
}
