import type { ReactNode } from 'react'
import { InboxIcon } from 'lucide-react'

interface EstadoVacioProps {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export function EstadoVacio({ titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <InboxIcon className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
