// Traduce los errores de Supabase a mensajes que entiende el usuario.

interface ErrorSupabase {
  code?: string
  message?: string
}

const POR_CODIGO: Record<string, string> = {
  '42501': 'Tu rol no tiene permiso para hacer esta acción.', // RLS rechazó la fila
  PGRST116: 'No encontramos el registro o no tienes permiso para verlo.', // .single() sin filas
  '23514': 'Algún dato no cumple las reglas del sistema. Revisa el formulario.', // CHECK
  '23503': 'El registro hace referencia a algo que no existe.', // llave foránea
}

export function mensajeDeError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ocurrió un error inesperado.'
  const { code, message } = error as ErrorSupabase
  if (code && POR_CODIGO[code]) return POR_CODIGO[code]
  // Excepciones de los triggers (raise exception): su mensaje ya es para el usuario.
  if (code === 'P0001' && message) return message
  if (message && /failed to fetch|network/i.test(message)) return 'No hay conexión con el servidor. Intenta de nuevo.'
  return 'Ocurrió un error inesperado.'
}

export class ErrorDeDatos extends Error {
  constructor(error: unknown) {
    super(mensajeDeError(error))
    this.name = 'ErrorDeDatos'
  }
}

export class ErrorDeSupabaseConfig extends Error {
    constructor(error: unknown) {
        super(mensajeDeError(error))
        this.name = 'ErrorDeSupabaseConfiguration'
    }
}
