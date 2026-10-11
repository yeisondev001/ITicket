import { StatCard } from '@/components/StatCard'

// KPI sin datos todavía. Se llenará cuando exista el dashboard.
export function KpiVacio({ titulo }: { titulo: string }) {
  return <StatCard titulo={titulo} valor="—" descripcion="Sin datos" />
}
