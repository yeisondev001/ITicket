import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tono = 'normal' | 'aviso' | 'exito'

const TONO_VALOR: Record<Tono, string> = {
  normal: 'text-foreground',
  aviso: 'text-amber-800',
  exito: 'text-green-800',
}

interface StatCardProps {
  titulo: string
  valor: number | string
  icono?: LucideIcon
  descripcion?: string
  tono?: Tono
}

// Tarjeta de indicador (KPI). La usan el panel del técnico y, más adelante, el dashboard.
export function StatCard({ titulo, valor, icono: Icono, descripcion, tono = 'normal' }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{titulo}</span>
          {Icono && <Icono className="size-4" aria-hidden="true" />}
        </div>
        <span className={cn('text-2xl font-semibold tabular-nums', TONO_VALOR[tono])}>{valor}</span>
        {descripcion && <span className="text-xs text-muted-foreground">{descripcion}</span>}
      </CardContent>
    </Card>
  )
}
