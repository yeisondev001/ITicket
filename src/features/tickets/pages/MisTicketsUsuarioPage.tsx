import { useMemo } from 'react'
import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'
import { EstadoCarga } from '@/components/feedback/EstadoCarga'
import { EstadoError } from '@/components/feedback/EstadoError'
import { EstadoVacio } from '@/components/feedback/EstadoVacio'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAhora } from '@/hooks/useAhora'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { TicketTable } from '../components/TicketTable'
import { useTickets } from '../hooks/useTickets'
import { ordenarPorSla } from '../lib/filtros'

// Tickets que reportó el usuario con sesión iniciada.
export function MisTicketsUsuarioPage() {
  const usuario = useUsuarioActual()
  const ahora = useAhora()
  const { tickets, cargando, error, recargar } = useTickets()
  const mios = useMemo(
    () => ordenarPorSla(tickets.filter((t) => t.creadoPor?.id === usuario.id)),
    [tickets, usuario.id],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Los incidentes que reportaste y su estado.</p>
        </div>
        <Link to="/tickets/nuevo" className={buttonVariants({ size: 'lg' })}>
          <PlusIcon aria-hidden="true" />
          Reportar incidente
        </Link>
      </div>
      <Card className="gap-0 py-0">
        {cargando && tickets.length === 0 ? (
          <EstadoCarga texto="Cargando tus tickets…" />
        ) : error ? (
          <EstadoError mensaje={error} onReintentar={recargar} />
        ) : mios.length === 0 ? (
          <EstadoVacio titulo="Todavía no has reportado incidentes" descripcion="Cuando reportes uno, lo verás aquí." />
        ) : (
          <TicketTable tickets={mios} ahora={ahora} />
        )}
      </Card>
    </div>
  )
}
