import { LoaderCircleIcon } from 'lucide-react'

export function EstadoCarga({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
      {texto}
    </div>
  )
}
