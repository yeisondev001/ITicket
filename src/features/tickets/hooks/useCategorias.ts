import { useConsulta } from '@/hooks/useConsulta'
import { listarCategorias } from '../services/tickets.service'

export function useCategorias() {
    const { datos, ...resto } = useConsulta('categorias', listarCategorias)
    return { categorias: datos ?? [], ...resto }
}
