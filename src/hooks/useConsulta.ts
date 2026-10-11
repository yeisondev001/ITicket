import { useCallback, useEffect, useRef, useState } from 'react'

interface Resultado<T> {
  clave: string // clave + versión de la consulta que produjo este resultado
  base: string // clave sin versión
  datos: T | null
  error: string | null
}

// Ejecuta una consulta asíncrona y expone sus estados de carga y error.
// `clave` identifica la consulta (p. ej. `ticket:1042`): cuando cambia, se vuelve a pedir.
// Al recargar la misma clave se conservan los datos anteriores para no hacer parpadear la pantalla.
export function useConsulta<T>(clave: string, consultar: () => Promise<T>) {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const [version, setVersion] = useState(0)
  const consultarRef = useRef(consultar)
  const claveActual = `${clave}#${version}`

  useEffect(() => {
    consultarRef.current = consultar
  })

  useEffect(() => {
    let activa = true
    consultarRef.current().then(
      (datos) => {
        if (activa) setResultado({ clave: claveActual, base: clave, datos, error: null })
      },
      (error: unknown) => {
        if (activa) {
          const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
          setResultado({ clave: claveActual, base: clave, datos: null, error: mensaje })
        }
      },
    )
    return () => {
      activa = false
    }
  }, [clave, claveActual])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const vigente = resultado?.clave === claveActual
  const mismaConsulta = resultado?.base === clave

  return {
    datos: mismaConsulta ? (resultado?.datos ?? null) : null,
    cargando: !vigente,
    error: vigente ? (resultado?.error ?? null) : null,
    recargar,
  }
}
