import { Link } from 'react-router'
import { SeccionVacia } from '@/components/SeccionVacia'
import { buttonVariants } from '@/components/ui/button'
import { useUsuarioActual } from '@/hooks/useUsuarioActual'
import { KpiVacio } from '../components/KpiVacio'
import { saludoSegunHora } from '../lib/saludo'

const KPIS = ['Tickets abiertos', 'En proceso', 'Pendientes', 'Resueltos']

export function HomePage() {
  const usuario = useUsuarioActual()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {saludoSegunHora(new Date())}, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Aquí tienes un resumen de la actividad de soporte.</p>
        </div>
        <Link to="/tickets" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Ver tickets
        </Link>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((titulo) => (
          <KpiVacio key={titulo} titulo={titulo} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SeccionVacia
          titulo="Tickets recientes"
          descripcion="Todavía no hay tickets. Aquí aparecerán los últimos tickets registrados."
        />
        <SeccionVacia titulo="Estado del SLA" descripcion="Sin datos de SLA por ahora." />
      </div>

      <SeccionVacia
        titulo="Actividad reciente"
        descripcion="Aquí verás cuándo se crean, asignan, escalan o resuelven tickets."
      />
    </div>
  )
}
