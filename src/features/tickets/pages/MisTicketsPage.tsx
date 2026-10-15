import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { MisTicketsUsuarioPage } from './MisTicketsUsuarioPage'
import { PanelTecnicoPage } from './PanelTecnicoPage'

// "Mis tickets" cambia según el rol: el técnico ve su cola de trabajo y
// el resto de roles, los tickets que reportaron.
export function MisTicketsPage() {
  const { rol } = useUsuarioActual()
  return rol === 'tecnico' ? <PanelTecnicoPage /> : <MisTicketsUsuarioPage />
}
