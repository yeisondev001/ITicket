import { useState, type ReactNode } from 'react'
import { useUsuarioActual } from '../../hooks/useUsuarioActual'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  titulo: string
  rutaActiva: string
  children: ReactNode
}

// Estructura común de todas las pantallas internas: sidebar + topbar + contenido.
export function AppLayout({ titulo, rutaActiva, children }: AppLayoutProps) {
  const usuario = useUsuarioActual()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar rol={usuario.rol} rutaActiva={rutaActiva} abierto={menuAbierto} />
      {menuAbierto && (
        <button
          type="button"
          className="sidebar-fondo"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      <div className="app-contenido">
        <Topbar
          titulo={titulo}
          usuario={usuario}
          menuAbierto={menuAbierto}
          onAlternarMenu={() => setMenuAbierto((abierto) => !abierto)}
        />
        <main>{children}</main>
      </div>
    </div>
  )
}
