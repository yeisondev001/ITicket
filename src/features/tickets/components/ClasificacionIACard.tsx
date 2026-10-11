import { SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CATEGORIA_ETIQUETA } from '../lib/etiquetas'
import type { ClasificacionIA } from '../types/ticket.types'

const NIVEL: Record<string, string> = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo', alta: 'Alta', media: 'Media', baja: 'Baja' }

interface ClasificacionIACardProps {
  clasificacion: ClasificacionIA | null
  requiereRevision: boolean
}

// Lo que propuso la IA se muestra aparte de los valores finales del ticket.
export function ClasificacionIACard({ clasificacion, requiereRevision }: ClasificacionIACardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-indigo-700" aria-hidden="true" />
          Clasificación sugerida por IA
        </CardTitle>
        {clasificacion && (
          <CardDescription>
            Confianza{' '}
            <span className="font-mono font-medium text-foreground">{Math.round(clasificacion.confianza * 100)}%</span>
          </CardDescription>
        )}
        <CardAction>
          {/* Se habilita cuando exista la edición de la clasificación (tarea de IA). */}
          <Button variant="outline" size="sm" disabled title="Disponible cuando se integre la IA">
            Corregir clasificación
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!clasificacion ? (
          <p className="text-sm text-muted-foreground">Este ticket todavía no tiene clasificación.</p>
        ) : (
          <>
            {requiereRevision && (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                La confianza es baja: un técnico debe revisar esta clasificación.
              </p>
            )}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Dato etiqueta="Categoría" valor={clasificacion.categoria ? CATEGORIA_ETIQUETA[clasificacion.categoria] : '—'} />
              <Dato etiqueta="Impacto" valor={clasificacion.impacto ? NIVEL[clasificacion.impacto] : '—'} />
              <Dato etiqueta="Urgencia" valor={clasificacion.urgencia ? NIVEL[clasificacion.urgencia] : '—'} />
              <Dato etiqueta="Prioridad (matriz)" valor={clasificacion.prioridad ?? '—'} />
            </dl>
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed">“{clasificacion.explicacion}”</p>
            <p className="text-xs text-muted-foreground">Modelo: {clasificacion.modelo}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-1 font-medium">{valor}</dd>
    </div>
  )
}
