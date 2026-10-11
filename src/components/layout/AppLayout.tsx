import { useState } from 'react'
import { Outlet, useMatches } from 'react-router'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

// Cada ruta puede declarar su título en `handle` (ver src/app/router.tsx).
export interface RutaHandle {
  titulo: string
}

function useTituloRuta(): string {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i].handle as RutaHandle | undefined
    if (handle?.titulo) return handle.titulo
  }
  return 'ITicket'
}

// Estructura común de las pantallas internas: sidebar + topbar + contenido.
export function AppLayout() {
  const usuario = useUsuarioActual()
  const titulo = useTituloRuta()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r bg-card md:block">
        <Sidebar rol={usuario.rol} />
      </aside>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">Navegación principal de ITicket</SheetDescription>
          <Sidebar rol={usuario.rol} onNavegar={() => setMenuAbierto(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo={titulo} usuario={usuario} onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
