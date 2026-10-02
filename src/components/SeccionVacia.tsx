import type { ReactNode } from 'react'

interface SeccionVaciaProps {
  titulo: string
  descripcion?: string
  children?: ReactNode
}

// Bloque con título y estado vacío. Sirve mientras una sección no tiene datos
// y luego como estado vacío real (por ejemplo, "no hay tickets").
export function SeccionVacia({ titulo, descripcion, children }: SeccionVaciaProps) {
  const idTitulo = `seccion-${titulo.toLowerCase().replaceAll(' ', '-')}`
  return (
    <section className="seccion" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>{titulo}</h2>
      {children ?? <p className="seccion-vacia">{descripcion}</p>}
    </section>
  )
}
