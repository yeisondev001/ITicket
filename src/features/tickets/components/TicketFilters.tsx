import { SearchIcon } from 'lucide-react'
import { NativeSelect } from '@/components/common/NativeSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIA_ETIQUETA, CATEGORIAS, ESTADO_ETIQUETA, ESTADOS, PRIORIDAD_ETIQUETA, PRIORIDADES } from '../lib/etiquetas'
import { FILTROS_INICIALES, type FiltrosTickets } from '../lib/filtros'

interface TicketFiltersProps {
  filtros: FiltrosTickets
  onChange: (filtros: FiltrosTickets) => void
}

export function TicketFilters({ filtros, onChange }: TicketFiltersProps) {
  const cambiar = <K extends keyof FiltrosTickets>(clave: K, valor: FiltrosTickets[K]) =>
    onChange({ ...filtros, [clave]: valor })
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(FILTROS_INICIALES)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-60 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={filtros.busqueda}
          onChange={(e) => cambiar('busqueda', e.target.value)}
          placeholder="Buscar por ID o título"
          aria-label="Buscar tickets por ID o título"
          className="h-9 bg-background pl-8"
        />
      </div>
      <NativeSelect
        aria-label="Filtrar por estado"
        value={filtros.estado}
        onChange={(e) => cambiar('estado', e.target.value as FiltrosTickets['estado'])}
      >
        <option value="todos">Estado: todos</option>
        {ESTADOS.map((estado) => (
          <option key={estado} value={estado}>
            {ESTADO_ETIQUETA[estado]}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Filtrar por prioridad"
        value={filtros.prioridad}
        onChange={(e) => cambiar('prioridad', e.target.value as FiltrosTickets['prioridad'])}
      >
        <option value="todas">Prioridad: todas</option>
        {PRIORIDADES.map((p) => (
          <option key={p} value={p}>
            {p} · {PRIORIDAD_ETIQUETA[p]}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Filtrar por categoría"
        value={filtros.categoria}
        onChange={(e) => cambiar('categoria', e.target.value as FiltrosTickets['categoria'])}
      >
        <option value="todas">Categoría: todas</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {CATEGORIA_ETIQUETA[c]}
          </option>
        ))}
      </NativeSelect>
      <Button variant="ghost" size="lg" disabled={!hayFiltros} onClick={() => onChange(FILTROS_INICIALES)}>
        Limpiar filtros
      </Button>
    </div>
  )
}
