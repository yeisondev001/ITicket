import type { NuevoTicketInput } from '../types/ticket.types'

// Mismos límites que el check de la tabla tickets.
export const TITULO_MIN = 3
export const TITULO_MAX = 200

export type ErroresTicket = Partial<Record<'titulo' | 'descripcion', string>>

export function validarNuevoTicket(input: NuevoTicketInput): ErroresTicket {
  const errores: ErroresTicket = {}
  const titulo = input.titulo.trim()
  if (titulo.length < TITULO_MIN) {
    errores.titulo = `Escribe un título de al menos ${TITULO_MIN} caracteres.`
  } else if (titulo.length > TITULO_MAX) {
    errores.titulo = `El título no puede pasar de ${TITULO_MAX} caracteres.`
  }
  if (input.descripcion.trim().length === 0) {
    errores.descripcion = 'Cuéntanos qué está pasando.'
  }
  return errores
}

export function tieneErrores(errores: ErroresTicket): boolean {
  return Object.keys(errores).length > 0
}
