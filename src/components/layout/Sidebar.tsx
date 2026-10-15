import { NavLink, useNavigate } from 'react-router'
import { LogOutIcon, TicketIcon } from 'lucide-react'
import { navegacionPorRol, type ItemNavegacion } from '@/config/navegacion'
import { useAuth } from '@/features/auth/context/useAuth'
import { cn } from '@/lib/utils'
import type { Rol } from '@/types/usuario'

interface SidebarProps {
  rol: Rol
  onNavegar?: () => void // cierra el menú en celulares
  className?: string
}

function ListaNavegacion({ items, onNavegar }: { items: ItemNavegacion[]; onNavegar?: () => void }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map(({ id, ruta, etiqueta, icono: Icono }) => (
        <li key={id}>
          <NavLink
            to={ruta}
            end={ruta === '/'}
            onClick={onNavegar}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
              )
            }
          >
            <Icono className="size-4.5" aria-hidden="true" />
            {etiqueta}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ rol, onNavegar, className }: SidebarProps) {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const salir = async () => {
    onNavegar?.()
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <div className={cn('flex h-full flex-col gap-6 px-3 py-5', className)}>
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TicketIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight">ITicket</span>
      </div>
      <nav aria-label="Navegación principal">
        <ListaNavegacion items={navegacionPorRol(rol, 'principal')} onNavegar={onNavegar} />
      </nav>
      <nav aria-label="Cuenta" className="mt-auto border-t pt-3">
        <ListaNavegacion items={navegacionPorRol(rol, 'inferior')} onNavegar={onNavegar} />
        <button
          type="button"
          onClick={salir}
          className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <LogOutIcon className="size-4.5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </nav>
    </div>
  )
}
