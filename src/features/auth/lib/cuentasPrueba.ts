import type { Rol } from '@/types/usuario'
import { CONTRASENA_DEMO, CUENTAS_DEMO } from '../data/cuentas.mock'

// Cuentas de prueba del proyecto de Supabase de pruebas con acceso rápido. Los
// correos no son secretos; la contraseña nunca va en el código: cada integrante
// la pone en su .env.local (VITE_CUENTAS_PRUEBA_CONTRASENA).
// El administrador no está a propósito: puede borrar tickets y cambiar roles,
// así que para entrar como admin se escriben el correo y la contraseña.
export const CUENTAS_PRUEBA_SUPABASE: { correo: string; rol: Rol }[] = [
  { correo: 'usuario@iticket.dev', rol: 'usuario' },
  { correo: 'tecnico@iticket.dev', rol: 'tecnico' },
  { correo: 'supervisor@iticket.dev', rol: 'supervisor' },
]

export interface CuentasDePrueba {
  visible: boolean
  cuentas: { correo: string; rol: Rol }[]
  contrasena: string | null // null: no está configurada en este equipo
}

interface Entorno {
  usaSupabase: boolean
  desarrollo: boolean // la app corre con npm run dev
  contrasenaLocal?: string
  // Se pasan desde fuera para que, en la versión publicada, ni los correos
  // lleguen al navegador.
  cuentasSupabase?: { correo: string; rol: Rol }[]
}

// Qué cuentas de prueba se muestran en el login:
// - modo demo: las cuentas simuladas, con su contraseña de demostración;
// - con Supabase, solo en desarrollo: las cuentas reales, con la contraseña de
//   .env.local si existe;
// - con Supabase en la versión publicada: ninguna.
export function cuentasDePrueba({ usaSupabase, desarrollo, contrasenaLocal, cuentasSupabase = [] }: Entorno): CuentasDePrueba {
  if (!usaSupabase) {
    return {
      visible: true,
      cuentas: CUENTAS_DEMO.map(({ correo, rol }) => ({ correo, rol })),
      contrasena: CONTRASENA_DEMO,
    }
  }
  if (!desarrollo) return { visible: false, cuentas: [], contrasena: null }
  return {
    visible: true,
    cuentas: cuentasSupabase,
    contrasena: contrasenaLocal?.trim() || null,
  }
}
