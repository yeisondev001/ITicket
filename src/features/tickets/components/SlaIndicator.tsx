import { ClockIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { calcularSla, formatoDuracion, SLA_ETIQUETA, type EstadoSla } from '../lib/sla'
import type { Ticket } from '../types/ticket.types'

const COLOR: Record<EstadoSla, { texto: string; barra: string }> = {
  sin_sla: { texto: 'text-muted-foreground', barra: '[&>[data-slot=progress-indicator]]:bg-muted-foreground' },
  dentro: { texto: 'text-green-800', barra: '[&>[data-slot=progress-indicator]]:bg-green-600' },
  proximo: { texto: 'text-amber-800', barra: '[&>[data-slot=progress-indicator]]:bg-amber-600' },
  vencido: { texto: 'text-red-700', barra: '[&>[data-slot=progress-indicator]]:bg-red-600' },
  cumplido: { texto: 'text-muted-foreground', barra: '[&>[data-slot=progress-indicator]]:bg-muted-foreground' },
  incumplido: { texto: 'text-red-700', barra: '[&>[data-slot=progress-indicator]]:bg-red-600' },
}

interface SlaIndicatorProps {
  ticket: Pick<Ticket, 'createdAt' | 'slaVenceEn' | 'resueltoEn' | 'cerradoEn'>
  ahora: number
  variante?: 'compacto' | 'detalle'
  className?: string
}

// Muestra el tiempo restante del SLA con texto (no solo color).
export function SlaIndicator({ ticket, ahora, variante = 'compacto', className }: SlaIndicatorProps) {
  const sla = calcularSla(ticket, ahora)
  const color = COLOR[sla.estado]
  const terminado = sla.estado === 'cumplido' || sla.estado === 'incumplido' || sla.estado === 'sin_sla'
  const tiempo = terminado ? '—' : formatoDuracion(sla.restanteMs)

  if (variante === 'compacto') {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className={cn('font-mono text-sm font-medium tabular-nums', color.texto)}>{tiempo}</span>
        <span className="text-xs text-muted-foreground">{SLA_ETIQUETA[sla.estado]}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <ClockIcon className={cn('size-4', color.texto)} aria-hidden="true" />
        <span className={color.texto}>{SLA_ETIQUETA[sla.estado]}</span>
      </div>
      {!terminado && (
        <span className={cn('font-mono text-3xl font-medium tabular-nums', color.texto)}>{tiempo}</span>
      )}
      <SlaBarra ticket={ticket} ahora={ahora} className="h-2" />
      <span className="text-xs text-muted-foreground">{sla.porcentajeUsado}% del tiempo usado</span>
    </div>
  )
}

// Barra de tiempo consumido, con el color del estado del SLA.
export function SlaBarra({ ticket, ahora, className }: Omit<SlaIndicatorProps, 'variante'>) {
  const sla = calcularSla(ticket, ahora)
  return (
    <Progress
      value={sla.porcentajeUsado}
      aria-label="Tiempo de SLA consumido"
      className={cn('h-1.5', COLOR[sla.estado].barra, className)}
    />
  )
}
