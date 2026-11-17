import { describe, expect, it } from 'vitest'
import { TICKETS_MOCK } from '../data/tickets.mock'
import {
  agregarComentario,
  cambiarEstado,
  crearTicket,
  eliminarTicket,
  listarTickets,
  obtenerTicket,
  tomarTicket,
} from './tickets.service'

// Servicio en modo demo: las pruebas corren sin Supabase, con los datos de prueba.
const autor = { id: 'mock-usuario-1', nombre: 'María López' }
const tecnico = { id: 'mock-tecnico-1', nombre: 'Starlyn' }
const nuevo = { titulo: '  Impresora sin tinta ', descripcion: ' No imprime ', servicioId: null, categoria: null }

describe('servicio de tickets en modo demo', () => {
  it('lista los tickets de prueba', async () => {
    const tickets = await listarTickets()
    expect(tickets.length).toBeGreaterThanOrEqual(TICKETS_MOCK.length)
  })

  it('crea un ticket con los textos limpios, sin asignar y para revisión', async () => {
    const ticket = await crearTicket(nuevo, autor)
    expect(ticket).toMatchObject({
      titulo: 'Impresora sin tinta',
      descripcion: 'No imprime',
      estado: 'nuevo',
      prioridad: 'P3',
      requiereRevision: true,
      asignadoA: null,
    })
    expect(ticket.creadoPor).toEqual(autor)
  })

  it('el ticket nuevo aparece primero en la lista', async () => {
    const creado = await crearTicket(nuevo, autor)
    const [primero] = await listarTickets()
    expect(primero.id).toBe(creado.id)
  })

  it('al resolver guarda la solución, la fecha y la actividad', async () => {
    const { id } = await crearTicket(nuevo, autor)
    const resuelto = await cambiarEstado(id, 'resuelto', tecnico, ' Se cambió el tóner ')
    expect(resuelto.solucion).toBe('Se cambió el tóner')
    expect(resuelto.resueltoEn).not.toBeNull()

    const detalle = await obtenerTicket(id)
    expect(detalle?.actividad.map((a) => a.tipo)).toEqual(['creado', 'resuelto'])
  })

  it('un técnico toma un ticket sin asignar y otro ya no puede', async () => {
    const { id } = await crearTicket(nuevo, autor)
    const tomado = await tomarTicket(id, tecnico)
    expect(tomado).toMatchObject({ estado: 'asignado', asignadoA: tecnico })
    await expect(tomarTicket(id, { id: 'otro', nombre: 'Otro' })).rejects.toThrow('Otro técnico ya tomó este ticket.')
  })

  it('agrega comentarios al historial', async () => {
    const { id } = await crearTicket(nuevo, autor)
    await agregarComentario(id, tecnico, '  Voy en camino ')
    const detalle = await obtenerTicket(id)
    expect(detalle?.actividad.at(-1)).toMatchObject({ tipo: 'comentario', comentario: 'Voy en camino' })
  })

  it('elimina el ticket con su historial', async () => {
    const { id } = await crearTicket(nuevo, autor)
    await eliminarTicket(id)
    await expect(obtenerTicket(id)).resolves.toBeNull()
    expect((await listarTickets()).some((t) => t.id === id)).toBe(false)
  })

  it('no elimina un ticket que no existe', async () => {
    await expect(eliminarTicket(999_999)).rejects.toThrow('No existe el ticket 999999')
  })
})
