import { useEffect, useState } from 'react'

// Hora actual que se actualiza sola. Sirve para los contadores de SLA.
export function useAhora(intervaloMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return ahora
}
