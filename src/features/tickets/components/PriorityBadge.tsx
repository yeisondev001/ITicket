import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRIORIDAD_ETIQUETA } from '../lib/etiquetas'
import type { TicketPrioridad } from '../types/ticket.types'

const COLOR: Record<TicketPrioridad, string> = {
  P1: 'bg-red-100 text-red-800',
  P2: 'bg-orange-100 text-orange-800',
  P3: 'bg-yellow-100 text-yellow-800',
  P4: 'bg-slate-100 text-slate-700',
}

export function PriorityBadge({ prioridad }: { prioridad: TicketPrioridad | null }) {
  if (!prioridad) {
    return <Badge variant="outline">Sin prioridad</Badge>
  }
  return (
    <Badge variant="secondary" className={cn('font-semibold', COLOR[prioridad])}>
      {prioridad} · {PRIORIDAD_ETIQUETA[prioridad]}
    </Badge>
  )
}
