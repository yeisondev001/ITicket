import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'
import { EstadoCarga } from '@/components/feedback/EstadoCarga'
import { EstadoError } from '@/components/feedback/EstadoError'
import { EstadoVacio } from '@/components/feedback/EstadoVacio'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAhora } from '@/hooks/useAhora'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { TicketFilters } from '../components/TicketFilters'
import { TicketTable } from '../components/TicketTable'
import { useTickets } from '../hooks/useTickets'
import { cumpleFiltros, cumpleVista, FILTROS_INICIALES, ordenarPorSla, type VistaTickets } from '../lib/filtros'

const VISTAS: { id: VistaTickets; etiqueta: string }[] = [
  { id: 'abiertos', etiqueta: 'Abiertos' },
  { id: 'mios', etiqueta: 'Asignados a mí' },
  { id: 'riesgo', etiqueta: 'SLA en riesgo' },
  { id: 'todos', etiqueta: 'Todos' },
]

export function TicketsPage() {
  const usuario = useUsuarioActual()
  const ahora = useAhora()
  const { tickets, cargando, error, recargar } = useTickets()
  const [vista, setVista] = useState<VistaTickets>('abiertos')
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  const conteo = useMemo(
    () =>
      Object.fromEntries(
        VISTAS.map((v) => [v.id, tickets.filter((t) => cumpleVista(t, v.id, usuario.id, ahora)).length]),
      ) as Record<VistaTickets, number>,
    [tickets, usuario.id, ahora],
  )

  const visibles = useMemo(
    () => ordenarPorSla(tickets.filter((t) => cumpleVista(t, vista, usuario.id, ahora) && cumpleFiltros(t, filtros))),
    [tickets, vista, filtros, usuario.id, ahora],
  )

  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(FILTROS_INICIALES)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos los incidentes registrados, ordenados por vencimiento del SLA.
          </p>
        </div>
        <Link to="/tickets/nuevo" className={buttonVariants({ size: 'lg' })}>
          <PlusIcon aria-hidden="true" />
          Nuevo ticket
        </Link>
      </div>

      <Tabs value={vista} onValueChange={(v) => setVista(v as VistaTickets)}>
        <TabsList variant="line" aria-label="Vistas de tickets" className="flex-wrap">
          {VISTAS.map((v) => (
            <TabsTrigger key={v.id} value={v.id} className="px-3">
              {v.etiqueta}
              <span className="rounded-full bg-muted px-2 text-xs tabular-nums">{conteo[v.id]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={vista} className="flex flex-col gap-4 pt-2">
      <TicketFilters filtros={filtros} onChange={setFiltros} />

      <Card className="gap-0 py-0">
        {cargando && tickets.length === 0 ? (
          <EstadoCarga texto="Cargando tickets…" />
        ) : error ? (
          <EstadoError mensaje={error} onReintentar={recargar} />
        ) : visibles.length === 0 ? (
          <EstadoVacio
            titulo="No hay tickets en esta vista"
            descripcion={hayFiltros ? 'Prueba quitando algunos filtros.' : 'Cuando lleguen tickets aparecerán aquí.'}
            accion={
              hayFiltros && (
                <Button variant="outline" onClick={() => setFiltros(FILTROS_INICIALES)}>
                  Limpiar filtros
                </Button>
              )
            }
          />
        ) : (
          <TicketTable tickets={visibles} ahora={ahora} />
        )}
        <div className="border-t px-4 py-3 text-sm text-muted-foreground" aria-live="polite">
          Mostrando {visibles.length} de {tickets.length} tickets
        </div>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
