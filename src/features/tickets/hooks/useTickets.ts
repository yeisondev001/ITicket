import { useConsulta } from '@/hooks/useConsulta'
import { listarTickets } from '../services/tickets.service'

export function useTickets() {
  const { datos, ...resto } = useConsulta('tickets', listarTickets)
  return { tickets: datos ?? [], ...resto }
}
