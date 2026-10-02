import { navegacionPorRol, type ItemNavegacion } from '../../config/navegacion'
import type { Rol } from '../../types/usuario'

interface SidebarProps {
  rol: Rol
  rutaActiva: string
  abierto: boolean
}

function ListaNavegacion({ items, rutaActiva }: { items: ItemNavegacion[]; rutaActiva: string }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <a href={item.ruta} aria-current={item.ruta === rutaActiva ? 'page' : undefined}>
            {item.etiqueta}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ rol, rutaActiva, abierto }: SidebarProps) {
  return (
    <aside id="sidebar" className="sidebar" data-abierto={abierto}>
      <div className="sidebar-logo">ITicket</div>
      <nav aria-label="Navegación principal">
        <ListaNavegacion items={navegacionPorRol(rol, 'principal')} rutaActiva={rutaActiva} />
      </nav>
      <nav aria-label="Cuenta" className="sidebar-inferior">
        <ListaNavegacion items={navegacionPorRol(rol, 'inferior')} rutaActiva={rutaActiva} />
      </nav>
    </aside>
  )
}
