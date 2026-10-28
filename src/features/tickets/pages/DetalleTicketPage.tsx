import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeftIcon, ActivityIcon } from 'lucide-react'
import { NativeSelect } from '@/components/common/NativeSelect'
import { EstadoCarga } from '@/components/feedback/EstadoCarga'
import { EstadoError } from '@/components/feedback/EstadoError'
import { EstadoVacio } from '@/components/feedback/EstadoVacio'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAhora } from '@/hooks/useAhora'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { ActivityList } from '../components/ActivityList'
import { ClasificacionIACard } from '../components/ClasificacionIACard'
import { PriorityBadge } from '../components/PriorityBadge'
import { SlaIndicator } from '../components/SlaIndicator'
import { StatusBadge } from '../components/StatusBadge'
import { useTicket } from '../hooks/useTicket'
import { CATEGORIA_ETIQUETA, codigoTicket, ESTADO_ETIQUETA, estaAbierto, formatoFecha, ORIGEN_ETIQUETA } from '../lib/etiquetas'
import { agregarComentario, cambiarEstado } from '../services/tickets.service'
import type { Ticket, TicketEstado } from '../types/ticket.types'

const ESTADOS_EDITABLES: TicketEstado[] = ['asignado', 'en_progreso', 'escalado', 'resuelto', 'cerrado']

export function DetalleTicketPage() {
  const { id } = useParams()
  const ticketId = Number(id)
  const { detalle, cargando, error, recargar } = useTicket(ticketId)

  if (!Number.isInteger(ticketId)) {
    return <TicketNoEncontrado />
  }
  if (cargando && !detalle) {
    return <EstadoCarga texto="Cargando ticket…" />
  }
  if (error) {
    return <EstadoError mensaje={error} onReintentar={recargar} />
  }
  if (!detalle) {
    return <TicketNoEncontrado />
  }

  return <DetalleTicket ticket={detalle.ticket} detalle={detalle} onCambio={recargar} />
}

function TicketNoEncontrado() {
  return (
    <EstadoVacio
      titulo="No encontramos este ticket"
      descripcion="Puede que el enlace esté mal escrito o que el ticket ya no exista."
      accion={
        <Link to="/tickets" className={buttonVariants({ variant: 'outline' })}>
          Volver a tickets
        </Link>
      }
    />
  )
}

interface DetalleTicketProps {
  ticket: Ticket
  detalle: NonNullable<ReturnType<typeof useTicket>['detalle']>
  onCambio: () => void
}

function DetalleTicket({ ticket, detalle, onCambio }: DetalleTicketProps) {
  const usuario = useUsuarioActual()
  const autor = { id: usuario.id, nombre: usuario.nombre }
  const ahora = useAhora()
  const [guardando, setGuardando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [resolviendo, setResolviendo] = useState(false)
  const [solucion, setSolucion] = useState('')
  const [comentario, setComentario] = useState('')

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setGuardando(true)
    setErrorAccion(null)
    try {
      await accion()
      onCambio()
      return true
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No se pudo guardar el cambio.')
      return false
    } finally {
      setGuardando(false)
    }
  }

  const abierto = estaAbierto(ticket.estado)

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/tickets"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Volver a tickets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{codigoTicket(ticket.id)}</span>
            <PriorityBadge prioridad={ticket.prioridad} />
            <StatusBadge estado={ticket.estado} />
            <Badge variant="outline" className="gap-1">
              {ticket.origen === 'monitoreo' && <ActivityIcon aria-hidden="true" />}
              {ORIGEN_ETIQUETA[ticket.origen]}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.titulo}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="cambiar-estado" className="sr-only">
            Cambiar estado
          </Label>
          <NativeSelect
            id="cambiar-estado"
            value={ticket.estado}
            disabled={guardando}
            onChange={(e) => {
              const estado = e.target.value as TicketEstado
              if (estado === 'resuelto') setResolviendo(true)
              else void ejecutar(() => cambiarEstado(ticket.id, estado, autor))
            }}
          >
            {ticket.estado === 'nuevo' && <option value="nuevo">{ESTADO_ETIQUETA.nuevo}</option>}
            {ESTADOS_EDITABLES.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_ETIQUETA[estado]}
              </option>
            ))}
          </NativeSelect>
          <Button
            variant="destructive"
            size="lg"
            disabled={guardando || !abierto || ticket.estado === 'escalado'}
            onClick={() => void ejecutar(() => cambiarEstado(ticket.id, 'escalado', autor))}
          >
            Escalar
          </Button>
          <Button size="lg" disabled={guardando || !abierto} onClick={() => setResolviendo(true)}>
            Resolver ticket
          </Button>
        </div>
      </div>

      {errorAccion && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorAccion}
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {resolviendo && (
            <Card className="ring-primary">
              <CardHeader>
                <CardTitle>Registrar solución</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Label htmlFor="solucion" className="font-normal text-muted-foreground">
                  Qué se hizo para resolverlo. Queda en la bitácora y sirve para incidentes parecidos.
                </Label>
                <Textarea
                  id="solucion"
                  rows={4}
                  value={solucion}
                  onChange={(e) => setSolucion(e.target.value)}
                  placeholder="Ej.: Se reinició el servicio y se liberó espacio en el disco del servidor."
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="lg" onClick={() => setResolviendo(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="lg"
                    className="bg-green-700 text-white hover:bg-green-800"
                    disabled={guardando || solucion.trim().length === 0}
                    onClick={async () => {
                      const ok = await ejecutar(() => cambiarEstado(ticket.id, 'resuelto', autor, solucion))
                      if (ok) {
                        setResolviendo(false)
                        setSolucion('')
                      }
                    }}
                  >
                    Marcar como resuelto
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-line">{ticket.descripcion}</p>
              {ticket.solucion && (
                <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                  <span className="font-medium">Solución:</span> {ticket.solucion}
                </div>
              )}
            </CardContent>
          </Card>

          <ClasificacionIACard clasificacion={detalle.clasificacion} requiereRevision={ticket.requiereRevision} />

          <Card>
            <CardHeader>
              <CardTitle>Actividad y comentarios</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ActivityList actividad={detalle.actividad} />
              <form
                className="flex flex-col gap-2 border-t pt-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const ok = await ejecutar(() => agregarComentario(ticket.id, autor, comentario))
                  if (ok) setComentario('')
                }}
              >
                <Label htmlFor="comentario">Agregar comentario</Label>
                <Textarea
                  id="comentario"
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Escribe una actualización para el equipo o el usuario"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={guardando || comentario.trim().length === 0}>
                    Comentar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>SLA</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <SlaIndicator ticket={ticket} ahora={ahora} variante="detalle" />
              {ticket.slaVenceEn && (
                <p className="text-sm text-muted-foreground">Vence: {formatoFecha(ticket.slaVenceEn)}</p>
              )}
              <p className="border-t pt-3 text-sm text-muted-foreground">
                Nivel de escalamiento: <span className="font-medium text-foreground">{ticket.nivelEscalamiento}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Campo etiqueta="Asignado a" valor={ticket.asignadoA?.nombre ?? 'Sin asignar'} />
                <Campo etiqueta="Creado por" valor={ticket.creadoPor?.nombre ?? 'Monitoreo'} />
                <Campo etiqueta="Categoría" valor={ticket.categoria ? CATEGORIA_ETIQUETA[ticket.categoria] : 'Sin categoría'} />
                <Campo
                  etiqueta="Servicio"
                  valor={ticket.servicio ? `${ticket.servicio.nombre}${ticket.servicio.esCritico ? ' (crítico)' : ''}` : 'No indicado'}
                />
                <Campo etiqueta="Creado" valor={formatoFecha(ticket.createdAt)} />
                <Campo etiqueta="Asignado" valor={ticket.asignadoEn ? formatoFecha(ticket.asignadoEn) : '—'} />
                <Campo etiqueta="Actualizado" valor={formatoFecha(ticket.updatedAt)} />
                {ticket.alertaId && <Campo etiqueta="ID de alerta" valor={ticket.alertaId} mono />}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Campo({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className={mono ? 'mt-0.5 truncate font-mono text-xs' : 'mt-0.5 truncate font-medium'}>{valor}</dd>
    </div>
  )
}
