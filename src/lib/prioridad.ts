export type Impacto = 'alto' | 'medio' | 'bajo'
export type Urgencia = 'alta' | 'media' | 'baja'
export type Prioridad = 'P1' | 'P2' | 'P3' | 'P4'

// Matriz de impacto x urgencia (ITIL 4). La IA estima impacto y urgencia;
// la prioridad sale de esta tabla, no del modelo.
const MATRIZ: Record<Impacto, Record<Urgencia, Prioridad>> = {
  alto: { alta: 'P1', media: 'P2', baja: 'P3' },
  medio: { alta: 'P2', media: 'P3', baja: 'P4' },
  bajo: { alta: 'P3', media: 'P4', baja: 'P4' },
}

// Tiempo máximo de atención por prioridad, en horas.
export const SLA_HORAS: Record<Prioridad, number> = {
  P1: 1,
  P2: 4,
  P3: 24,
  P4: 72,
}

const ORDEN: Prioridad[] = ['P1', 'P2', 'P3', 'P4']

export interface OpcionesPrioridad {
  servicioCritico?: boolean
}

export function calcularPrioridad(
  impacto: Impacto,
  urgencia: Urgencia,
  { servicioCritico = false }: OpcionesPrioridad = {},
): Prioridad {
  const base = MATRIZ[impacto][urgencia]
  // Regla fija: un servicio crítico nunca baja de P2.
  if (servicioCritico && ORDEN.indexOf(base) > ORDEN.indexOf('P2')) {
    return 'P2'
  }
  return base
}
