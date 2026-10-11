import { BellIcon, MenuIcon, SearchIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROL_ETIQUETA, type UsuarioActual } from '@/types/usuario'

interface TopbarProps {
  titulo: string
  usuario: UsuarioActual
  onAbrirMenu: () => void
}

export function Topbar({ titulo, usuario, onAbrirMenu }: TopbarProps) {
  return (
    <header className="flex items-center gap-3 border-b bg-card px-4 py-3 md:px-7">
      <Button variant="outline" size="icon-lg" className="md:hidden" aria-label="Abrir menú" onClick={onAbrirMenu}>
        <MenuIcon aria-hidden="true" />
      </Button>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{titulo}</p>
      <div className="relative hidden w-72 sm:block">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        {/* La búsqueda global se conecta cuando exista el backend. */}
        <Input type="search" placeholder="Buscar en ITicket…" aria-label="Buscar en ITicket" className="h-9 pl-8" disabled />
      </div>
      <Button variant="outline" size="icon-lg" aria-label="Notificaciones" disabled>
        <BellIcon aria-hidden="true" />
      </Button>
      <div className="flex items-center gap-2.5">
        <Avatar size="lg">
          <AvatarFallback className="bg-blue-900 font-semibold text-white">{usuario.nombre.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold">{usuario.nombre}</p>
          <p className="text-xs text-muted-foreground">{ROL_ETIQUETA[usuario.rol]}</p>
        </div>
      </div>
    </header>
  )
}
