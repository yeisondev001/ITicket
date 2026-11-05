import type { Rol } from '@/types/usuario'
import { CUENTAS_DEMO } from '../data/cuentas.mock'

// Cuentas de prueba del proyecto de Supabase de pruebas, una por rol. Los
// correos no son secretos; la contraseña la tiene el servidor (Edge Function
// entrar-cuenta-prueba) y nunca llega al frontend.
export const CUENTAS_PRUEBA_SUPABASE: { correo: string; rol: Rol }[] = [
  { correo: 'usuario@iticket.dev', rol: 'usuario' },
  { correo: 'tecnico@iticket.dev', rol: 'tecnico' },
  { correo: 'supervisor@iticket.dev', rol: 'supervisor' },
  { correo: 'admin@iticket.dev', rol: 'administrador' },
]

export interface CuentasDePrueba {
  visible: boolean
  cuentas: { correo: string; rol: Rol }[]
}

interface Entorno {
  usaSupabase: boolean
  desarrollo: boolean // la app corre con npm run dev
  // Se pasan desde fuera para que, en la versión publicada, ni los correos
  // lleguen al navegador.
  cuentasSupabase?: { correo: string; rol: Rol }[]
}

// Qué cuentas de prueba se muestran en el login:
// - modo demo: las cuentas simuladas;
// - con Supabase, solo en desarrollo: las cuentas del proyecto de pruebas;
// - con Supabase en la versión publicada: ninguna.
export function cuentasDePrueba({ usaSupabase, desarrollo, cuentasSupabase = [] }: Entorno): CuentasDePrueba {
  if (!usaSupabase) return { visible: true, cuentas: CUENTAS_DEMO.map(({ correo, rol }) => ({ correo, rol })) }
  if (!desarrollo) return { visible: false, cuentas: [] }
  return { visible: true, cuentas: cuentasSupabase }
}
