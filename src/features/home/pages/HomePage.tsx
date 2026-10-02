import { AppLayout } from '../../../components/layout/AppLayout'
import { SeccionVacia } from '../../../components/SeccionVacia'
import { useUsuarioActual } from '../../../hooks/useUsuarioActual'
import { KpiVacio } from '../components/KpiVacio'
import { saludoSegunHora } from '../lib/saludo'

const KPIS = ['Tickets abiertos', 'En proceso', 'Pendientes', 'Resueltos']

export function HomePage() {
  const usuario = useUsuarioActual()

  return (
    <AppLayout titulo="Inicio" rutaActiva="/">
      <div className="home">
        <header>
          <h2 className="home-saludo">
            {saludoSegunHora(new Date())}, {usuario.nombre}
          </h2>
          <p>Aquí tienes un resumen de la actividad de soporte.</p>
        </header>

        <SeccionVacia titulo="Resumen">
          <div className="kpis">
            {KPIS.map((titulo) => (
              <KpiVacio key={titulo} titulo={titulo} />
            ))}
          </div>
        </SeccionVacia>

        <div className="home-columnas">
          <SeccionVacia
            titulo="Tickets recientes"
            descripcion="Todavía no hay tickets. Aquí aparecerán los últimos tickets registrados."
          />
          <SeccionVacia
            titulo="Estado del SLA"
            descripcion="Sin datos de SLA por ahora."
          />
        </div>

        <SeccionVacia
          titulo="Actividad reciente"
          descripcion="Aquí verás cuándo se crean, asignan, escalan o resuelven tickets."
        />
      </div>
    </AppLayout>
  )
}
