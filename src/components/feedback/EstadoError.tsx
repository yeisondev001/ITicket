import { CircleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EstadoErrorProps {
  mensaje: string
  onReintentar?: () => void
}

export function EstadoError({ mensaje, onReintentar }: EstadoErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <CircleAlertIcon className="size-6 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-medium">No pudimos cargar la información</p>
        <p className="text-sm text-muted-foreground">{mensaje}</p>
      </div>
      {onReintentar && (
        <Button variant="outline" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
