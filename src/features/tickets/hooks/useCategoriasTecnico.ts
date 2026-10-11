import { useConsulta } from '@/hooks/useConsulta'
import { categoriasDelTecnico } from '../services/tickets.service'

export function useCategoriasTecnico(tecnicoId: string) {
  const { datos, ...resto } = useConsulta(`categorias:${tecnicoId}`, () => categoriasDelTecnico(tecnicoId))
  return { categorias: datos ?? [], ...resto }
}
