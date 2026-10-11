import { Link } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CATEGORIA_ETIQUETA, codigoTicket, formatoFecha } from '../lib/etiquetas'
import { calcularSla } from '../lib/sla'
import type { Ticket } from '../types/ticket.types'
import { PriorityBadge } from './PriorityBadge'
import { SlaBarra, SlaIndicator } from './SlaIndicator'
import { StatusBadge } from './StatusBadge'

interface TicketQueueCardProps {
  ticket: Ticket
  ahora: number
  ocupado: boolean
  onIniciar: (id: number) => void
}

// Tarjeta de la cola del técnico: lo esencial para decidir qué atender primero.
export function TicketQueueCard({ ticket, ahora, ocupado, onIniciar }: TicketQueueCardProps) {
  const sla = calcularSla(ticket, ahora)
  const resaltar = sla.estado === 'proximo' || sla.estado === 'vencido'
  return (
    <Card className={cn(resaltar && 'ring-amber-300')}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{codigoTicket(ticket.id)}</span>
              <PriorityBadge prioridad={ticket.prioridad} />
              <StatusBadge estado={ticket.estado} />
            </div>
            <h3 className="mt-2 font-medium">{ticket.titulo}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {ticket.categoria ? CATEGORIA_ETIQUETA[ticket.categoria] : 'Sin categoría'} · creado{' '}
              {formatoFecha(ticket.createdAt)}
            </p>
          </div>
          <SlaIndicator ticket={ticket} ahora={ahora} className="items-end text-right" />
        </div>
        <SlaBarra ticket={ticket} ahora={ahora} />
        <div className="flex flex-wrap justify-end gap-2">
          {ticket.estado === 'asignado' && (
            <Button variant="outline" size="lg" disabled={ocupado} onClick={() => onIniciar(ticket.id)}>
              Iniciar atención
            </Button>
          )}
          <Link to={`/tickets/${ticket.id}`} className={buttonVariants({ size: 'lg' })}>
            Abrir
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
