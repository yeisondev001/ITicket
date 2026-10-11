import { useState } from 'react'
import { Link } from 'react-router'
import { CircleCheckIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { SLA_HORAS } from '@/lib/prioridad'
import { PriorityBadge } from '../components/PriorityBadge'
import { StatusBadge } from '../components/StatusBadge'
import { TicketForm } from '../components/TicketForm'
import { useServicios } from '../hooks/useServicios'
import { codigoTicket, PRIORIDADES } from '../lib/etiquetas'
import { crearTicket } from '../services/tickets.service'
import type { NuevoTicketInput, Ticket } from '../types/ticket.types'

const PASOS = [
  { titulo: 'La IA lo clasifica', texto: 'Estima categoría, impacto y urgencia.' },
  { titulo: 'Se calcula la prioridad', texto: 'Con la matriz ITIL de impacto por urgencia.' },
  { titulo: 'Se asigna a un técnico', texto: 'Según la categoría que cubre cada técnico.' },
  { titulo: 'Recibes avisos', texto: 'Por correo o Telegram cuando cambie el estado.' },
]

export function NuevoTicketPage() {
  const usuario = useUsuarioActual()
  const { servicios } = useServicios()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creado, setCreado] = useState<Ticket | null>(null)
  const [intento, setIntento] = useState(0) // reinicia el formulario

  const crear = async (input: NuevoTicketInput) => {
    setEnviando(true)
    setError(null)
    try {
      setCreado(await crearTicket(input, { id: usuario.id, nombre: usuario.nombre }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el ticket. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportar un incidente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe el problema con tus palabras. El sistema lo clasifica y lo asigna al técnico adecuado.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardContent>
            {creado ? (
              <section aria-live="polite" className="flex flex-col gap-4">
                <CircleCheckIcon className="size-10 text-green-700" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-semibold">
                    Ticket <span className="font-mono">{codigoTicket(creado.id)}</span> creado
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Lo estamos clasificando. Te avisaremos cuando un técnico lo tome.
                  </p>
                </div>
                <dl className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd><StatusBadge estado={creado.estado} /></dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Servicio</dt>
                    <dd>{creado.servicio?.nombre ?? 'No indicado'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Clasificación IA</dt>
                    <dd>Pendiente</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/tickets/${creado.id}`} className={buttonVariants({ size: 'lg' })}>
                    Ver ticket
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setCreado(null)
                      setIntento((n) => n + 1)
                    }}
                  >
                    Reportar otro
                  </Button>
                </div>
              </section>
            ) : (
              <TicketForm key={intento} servicios={servicios} enviando={enviando} error={error} onSubmit={crear} />
            )}
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-5" aria-label="Información del proceso">
          <Card>
            <CardHeader>
              <CardTitle>Qué pasa después</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {PASOS.map((paso, i) => (
                  <li key={paso.titulo} className="flex gap-3 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-medium">{paso.titulo}</span>
                      <span className="text-muted-foreground">{paso.texto}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tiempo máximo de atención</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                {PRIORIDADES.map((p) => (
                  <li key={p} className="flex items-center justify-between">
                    <PriorityBadge prioridad={p} />
                    <span className="font-mono">{SLA_HORAS[p]} h</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
