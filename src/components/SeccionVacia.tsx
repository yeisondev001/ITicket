import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SeccionVaciaProps {
  titulo: string
  descripcion?: string
  children?: ReactNode
}

// Bloque con título y estado vacío. Sirve mientras una sección no tiene datos.
export function SeccionVacia({ titulo, descripcion, children }: SeccionVaciaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{titulo}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children ?? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{descripcion}</p>
        )}
      </CardContent>
    </Card>
  )
}
