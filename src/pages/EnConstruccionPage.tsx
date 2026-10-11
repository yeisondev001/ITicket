import { ConstructionIcon } from 'lucide-react'

// Pantalla para las secciones del menú que todavía no existen.
export function EnConstruccionPage() {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <ConstructionIcon className="size-8 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-lg font-semibold">Sección en construcción</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Esta parte de ITicket llega en un próximo sprint.</p>
    </div>
  )
}
