import { useConsulta } from '@/hooks/useConsulta'
import { listarServicios } from '../services/servicios.service'

export function useServicios() {
  const { datos, ...resto } = useConsulta('servicios', listarServicios)
  return { servicios: datos ?? [], ...resto }
}
