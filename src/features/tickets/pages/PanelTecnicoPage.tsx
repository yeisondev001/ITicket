import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CircleCheckIcon, ClockIcon, InboxIcon, ListTodoIcon } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { EstadoCarga } from '@/components/feedback/EstadoCarga'
import { EstadoError } from '@/components/feedback/EstadoError'
import { EstadoVacio } from '@/components/feedback/EstadoVacio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAhora } from '@/hooks/useAhora'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { PriorityBadge } from '../components/PriorityBadge'
import { TicketQueueCard } from '../components/TicketQueueCard'
import { useCategoriasTecnico } from '../hooks/useCategoriasTecnico'
import { useTickets } from '../hooks/useTickets'
import { CATEGORIA_ETIQUETA, codigoTicket, estaAbierto } from '../lib/etiquetas'
import { calcularSla, enRiesgo } from '../lib/sla'
import { cambiarEstado, tomarTicket } from '../services/tickets.service'

const HOY = () => new Date().toDateString()

export function PanelTecnicoPage() {
  const usuario = useUsuarioActual()
  const tecnico = { id: usuario.id, nombre: usuario.nombre }
  const ahora = useAhora()
  const { tickets, cargando, error, recargar } = useTickets()
  const { categorias } = useCategoriasTecnico(usuario.id)
  const [ocupado, setOcupado] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const cola = useMemo(
    () =>
      tickets
        .filter((t) => t.asignadoA?.id === usuario.id && estaAbierto(t.estado))
        .sort((a, b) => calcularSla(b, ahora).porcentajeUsado - calcularSla(a, ahora).porcentajeUsado),
    [tickets, usuario.id, ahora],
  )
  const libres = useMemo(
    () => tickets.filter((t) => !t.asignadoA && estaAbierto(t.estado) && t.categoria && categorias.includes(t.categoria)),
    [tickets, categorias],
  )
  const enRiesgoCount = cola.filter((t) => enRiesgo(calcularSla(t, ahora).estado)).length
  const resueltosHoy = tickets.filter(
    (t) => t.asignadoA?.id === usuario.id && t.resueltoEn && new Date(t.resueltoEn).toDateString() === HOY(),
  ).length

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setOcupado(true)
    setErrorAccion(null)
    try {
      await accion()
      recargar()
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    } finally {
      setOcupado(false)
    }
  }

  if (cargando && tickets.length === 0) return <EstadoCarga texto="Cargando tu cola…" />
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tu cola de trabajo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tus tickets abiertos, del que vence antes al que vence después.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard titulo="Asignados a mí" valor={cola.length} icono={ListTodoIcon} />
        <StatCard titulo="SLA en riesgo" valor={enRiesgoCount} icono={ClockIcon} tono={enRiesgoCount > 0 ? 'aviso' : 'normal'} />
        <StatCard titulo="Sin asignar en mis categorías" valor={libres.length} icono={InboxIcon} />
        <StatCard titulo="Resueltos hoy" valor={resueltosHoy} icono={CircleCheckIcon} tono="exito" />
      </div>

      {errorAccion && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorAccion}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="cola-titulo" className="flex min-w-0 flex-col gap-3">
          <h2 id="cola-titulo" className="font-medium">Atender primero</h2>
          {cola.length === 0 ? (
            <Card>
              <EstadoVacio titulo="No tienes tickets abiertos" descripcion="Toma uno de la lista de tickets sin asignar." />
            </Card>
          ) : (
            cola.map((ticket) => (
              <TicketQueueCard
                key={ticket.id}
                ticket={ticket}
                ahora={ahora}
                ocupado={ocupado}
                onIniciar={(id) => void ejecutar(() => cambiarEstado(id, 'en_progreso', tecnico))}
              />
            ))
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Sin asignar en tus categorías</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {libres.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tickets pendientes en tus categorías.</p>
              ) : (
                libres.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/tickets/${t.id}`} className="font-mono text-xs text-primary hover:underline">
                          {codigoTicket(t.id)}
                        </Link>
                        <PriorityBadge prioridad={t.prioridad} />
                      </div>
                      <p className="mt-1 text-sm font-medium">{t.titulo}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={ocupado}
                      aria-label={`Tomar ${codigoTicket(t.id)}`}
                      onClick={() => void ejecutar(() => tomarTicket(t.id, tecnico))}
                    >
                      Tomar
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tus categorías</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <Badge key={c} variant="outline">
                  {CATEGORIA_ETIQUETA[c]}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
