export interface CredencialesLogin {
  correo: string
  contrasena: string
}

export type ErroresLogin = Partial<Record<keyof CredencialesLogin, string>>

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarLogin({ correo, contrasena }: CredencialesLogin): ErroresLogin {
  const errores: ErroresLogin = {}
  if (correo.trim().length === 0) errores.correo = 'Escribe tu correo.'
  else if (!FORMATO_CORREO.test(correo.trim())) errores.correo = 'Revisa el formato del correo (ej.: nombre@empresa.com).'
  if (contrasena.length === 0) errores.contrasena = 'Escribe tu contraseña.'
  return errores
}
