import { ROL_ETIQUETA, type UsuarioActual } from '../../types/usuario'

interface TopbarProps {
  titulo: string
  usuario: UsuarioActual
  menuAbierto: boolean
  onAlternarMenu: () => void
}

export function Topbar({ titulo, usuario, menuAbierto, onAlternarMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-menu"
        aria-controls="sidebar"
        aria-expanded={menuAbierto}
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        onClick={onAlternarMenu}
      >
        ☰
      </button>
      <h1 className="topbar-titulo">{titulo}</h1>
      <input type="search" placeholder="Buscar tickets…" aria-label="Buscar tickets" disabled />
      <button type="button" aria-label="Notificaciones" disabled>
        🔔
      </button>
      <div className="topbar-usuario">
        <span className="avatar" aria-hidden="true">
          {usuario.nombre.charAt(0)}
        </span>
        <span>
          <strong>{usuario.nombre}</strong>
          <small>{ROL_ETIQUETA[usuario.rol]}</small>
        </span>
      </div>
    </header>
  )
}
