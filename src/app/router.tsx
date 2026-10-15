import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppLayout, type RutaHandle } from '@/components/layout/AppLayout'
import { RutaProtegida } from '@/features/auth/components/RutaProtegida'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { DetalleTicketPage } from '@/features/tickets/pages/DetalleTicketPage'
import { NuevoTicketPage } from '@/features/tickets/pages/NuevoTicketPage'
import { MisTicketsPage } from '@/features/tickets/pages/MisTicketsPage'
import { TicketsPage } from '@/features/tickets/pages/TicketsPage'
import { EnConstruccionPage } from '@/pages/EnConstruccionPage'
import { NoEncontradoPage } from '@/pages/NoEncontradoPage'

const titulo = (texto: string): RutaHandle => ({ titulo: texto })

// Rutas de la aplicación. Las internas pasan por RutaProtegida (requieren sesión);
// la validación del rol de cada ruta se agrega con las políticas RLS (#7).
const router = createBrowserRouter([
  // Ruta pública (sin sidebar)
  { path: 'login', element: <LoginPage /> },

  // Rutas internas: requieren sesión
  {
    element: <RutaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage />, handle: titulo('Inicio') },
          { path: 'tickets', element: <TicketsPage />, handle: titulo('Tickets') },
          { path: 'tickets/nuevo', element: <NuevoTicketPage />, handle: titulo('Nuevo ticket') },
          { path: 'tickets/:id', element: <DetalleTicketPage />, handle: titulo('Detalle del ticket') },
          // El técnico ve su panel de trabajo; el usuario, los tickets que reportó.
          { path: 'mis-tickets', element: <MisTicketsPage />, handle: titulo('Mis tickets') },
          { path: 'dashboard', element: <EnConstruccionPage />, handle: titulo('Dashboard') },
          { path: 'reportes', element: <EnConstruccionPage />, handle: titulo('Reportes') },
          { path: 'usuarios', element: <EnConstruccionPage />, handle: titulo('Usuarios') },
          { path: 'configuracion', element: <EnConstruccionPage />, handle: titulo('Configuración') },
          { path: 'perfil', element: <EnConstruccionPage />, handle: titulo('Perfil') },
          { path: '*', element: <NoEncontradoPage />, handle: titulo('No encontrado') },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
