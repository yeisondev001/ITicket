import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatoFecha } from '../lib/etiquetas'
import type { ActividadTicket } from '../types/ticket.types'

const SISTEMA = new Set(['Sistema', 'Monitoreo', 'Clasificación IA'])

export function ActivityItem({ actividad }: { actividad: ActividadTicket }) {
  const esSistema = SISTEMA.has(actividad.autor)
  return (
    <li className="flex gap-3">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback className={cn(esSistema ? 'bg-slate-600 text-white' : 'bg-blue-900 text-white')}>
          {actividad.autor === 'Clasificación IA' ? 'IA' : actividad.autor.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{actividad.autor}</span>{' '}
          <span className="text-muted-foreground">{actividad.descripcion}</span>
        </p>
        {actividad.comentario && (
          <p className="mt-1.5 rounded-lg border bg-muted/40 px-3 py-2 text-sm leading-relaxed whitespace-pre-line">
            {actividad.comentario}
          </p>
        )}
        <time dateTime={actividad.createdAt} className="mt-1 block text-xs text-muted-foreground">
          {formatoFecha(actividad.createdAt)}
        </time>
      </div>
    </li>
  )
}

export function ActivityList({ actividad }: { actividad: ActividadTicket[] }) {
  if (actividad.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay actividad.</p>
  }
  return (
    <ol className="flex flex-col gap-4">
      {actividad.map((a) => (
        <ActivityItem key={a.id} actividad={a} />
      ))}
    </ol>
  )
}
