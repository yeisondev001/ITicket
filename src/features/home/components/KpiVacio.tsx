interface KpiVacioProps {
  titulo: string
}

// Tarjeta KPI sin datos. Cuando llegue el dashboard real se convierte en StatCard.
export function KpiVacio({ titulo }: KpiVacioProps) {
  return (
    <article className="kpi">
      <h3>{titulo}</h3>
      <p className="kpi-valor" aria-label="Sin datos">—</p>
    </article>
  )
}
