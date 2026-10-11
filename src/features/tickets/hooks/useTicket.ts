import { useConsulta } from '@/hooks/useConsulta'
import { obtenerTicket } from '../services/tickets.service'

export function useTicket(id: number) {
  const { datos, ...resto } = useConsulta(`ticket:${id}`, () => obtenerTicket(id))
  return { detalle: datos, ...resto }
}
