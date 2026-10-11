import type { Ticket } from '../types/ticket.types'

export type EstadoSla = 'sin_sla' | 'dentro' | 'proximo' | 'vencido' | 'cumplido' | 'incumplido'

export interface InfoSla {
  estado: EstadoSla
  restanteMs: number // negativo si ya venció
  porcentajeUsado: number // 0 a 100
}

// A partir de este porcentaje del tiempo usado, el SLA está "próximo a vencer".
export const UMBRAL_PROXIMO = 75

export const SLA_ETIQUETA: Record<EstadoSla, string> = {
  sin_sla: 'Sin SLA',
  dentro: 'Dentro del SLA',
  proximo: 'Próximo a vencer',
  vencido: 'Vencido',
  cumplido: 'Cumplido',
  incumplido: 'Incumplido',
}

type DatosSla = Pick<Ticket, 'createdAt' | 'slaVenceEn' | 'resueltoEn' | 'cerradoEn'>

export function calcularSla(ticket: DatosSla, ahora: number): InfoSla {
  if (!ticket.slaVenceEn) {
    return { estado: 'sin_sla', restanteMs: 0, porcentajeUsado: 0 }
  }
  const inicio = Date.parse(ticket.createdAt)
  const vence = Date.parse(ticket.slaVenceEn)
  const total = Math.max(vence - inicio, 1)
  const fin = ticket.resueltoEn ?? ticket.cerradoEn

  if (fin) {
    const terminado = Date.parse(fin)
    const usado = Math.min(100, Math.round(((terminado - inicio) / total) * 100))
    return {
      estado: terminado <= vence ? 'cumplido' : 'incumplido',
      restanteMs: vence - terminado,
      porcentajeUsado: Math.max(0, usado),
    }
  }

  const restanteMs = vence - ahora
  const porcentajeUsado = Math.min(100, Math.max(0, Math.round(((ahora - inicio) / total) * 100)))
  let estado: EstadoSla = 'dentro'
  if (restanteMs <= 0) estado = 'vencido'
  else if (porcentajeUsado >= UMBRAL_PROXIMO) estado = 'proximo'
  return { estado, restanteMs, porcentajeUsado }
}

// 4_810_000 → "01:20:10"; negativo → "−00:32:15"
export function formatoDuracion(ms: number): string {
  const signo = ms < 0 ? '−' : ''
  const total = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${signo}${dos(h)}:${dos(m)}:${dos(s)}`
}

export function enRiesgo(estado: EstadoSla): boolean {
  return estado === 'proximo' || estado === 'vencido'
}
