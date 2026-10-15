import type { Rol } from '@/types/usuario'

// Pantalla a la que llega cada rol después de iniciar sesión.
const RUTA_INICIAL: Record<Rol, string> = {
  usuario: '/mis-tickets', // sus propios tickets
  tecnico: '/mis-tickets', // su cola de trabajo
  supervisor: '/tickets', // todos los tickets
  administrador: '/', // resumen general
}

export function rutaInicialPorRol(rol: Rol): string {
  return RUTA_INICIAL[rol]
}
