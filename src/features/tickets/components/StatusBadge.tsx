import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ESTADO_ETIQUETA } from '../lib/etiquetas'
import type { TicketEstado } from '../types/ticket.types'

const COLOR: Record<TicketEstado, { fondo: string; punto: string }> = {
  nuevo: { fondo: 'bg-blue-100 text-blue-800', punto: 'bg-blue-600' },
  asignado: { fondo: 'bg-violet-100 text-violet-800', punto: 'bg-violet-600' },
  en_progreso: { fondo: 'bg-sky-100 text-sky-800', punto: 'bg-sky-600' },
  escalado: { fondo: 'bg-rose-100 text-rose-800', punto: 'bg-rose-600' },
  resuelto: { fondo: 'bg-green-100 text-green-800', punto: 'bg-green-600' },
  cerrado: { fondo: 'bg-gray-100 text-gray-700', punto: 'bg-gray-500' },
}

export function StatusBadge({ estado }: { estado: TicketEstado }) {
  const color = COLOR[estado]
  return (
    <Badge variant="secondary" className={cn('gap-1.5 font-semibold', color.fondo)}>
      <span className={cn('size-1.5 rounded-full', color.punto)} aria-hidden="true" />
      {ESTADO_ETIQUETA[estado]}
    </Badge>
  )
}
