import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CATEGORIA_ETIQUETA, codigoTicket, formatoFecha, ORIGEN_ETIQUETA } from '../lib/etiquetas'
import type { Ticket } from '../types/ticket.types'
import { PriorityBadge } from './PriorityBadge'
import { SlaIndicator } from './SlaIndicator'
import { StatusBadge } from './StatusBadge'

interface TicketTableProps {
  tickets: Ticket[]
  ahora: number
}

export function TicketTable({ tickets, ahora }: TicketTableProps) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="px-4">ID</TableHead>
          <TableHead className="px-4">Título</TableHead>
          <TableHead className="px-4">Prioridad</TableHead>
          <TableHead className="px-4">Estado</TableHead>
          <TableHead className="px-4">Asignado a</TableHead>
          <TableHead className="px-4">Creado</TableHead>
          <TableHead className="px-4">SLA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="px-4 py-3">
              <Link
                to={`/tickets/${ticket.id}`}
                className="rounded-sm font-mono text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {codigoTicket(ticket.id)}
              </Link>
            </TableCell>
            <TableCell className="min-w-64 px-4 py-3 whitespace-normal">
              <div className="font-medium">{ticket.titulo}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{ticket.categoria ? CATEGORIA_ETIQUETA[ticket.categoria] : 'Sin categoría'}</span>
                <span aria-hidden="true">·</span>
                <span>{ORIGEN_ETIQUETA[ticket.origen]}</span>
                {ticket.requiereRevision && (
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-800">
                    Revisar clasificación IA
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="px-4 py-3">
              <PriorityBadge prioridad={ticket.prioridad} />
            </TableCell>
            <TableCell className="px-4 py-3">
              <StatusBadge estado={ticket.estado} />
            </TableCell>
            <TableCell className="px-4 py-3">
              {ticket.asignadoA ? ticket.asignadoA.nombre : <span className="text-muted-foreground">Sin asignar</span>}
            </TableCell>
            <TableCell className="px-4 py-3 text-muted-foreground">{formatoFecha(ticket.createdAt)}</TableCell>
            <TableCell className="px-4 py-3">
              <SlaIndicator ticket={ticket} ahora={ahora} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
