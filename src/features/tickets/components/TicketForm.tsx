import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { LoaderCircleIcon } from 'lucide-react'
import { NativeSelect } from '@/components/common/NativeSelect'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIA_ETIQUETA, CATEGORIAS } from '../lib/etiquetas'
import { tieneErrores, TITULO_MAX, validarNuevoTicket, type ErroresTicket } from '../lib/validacion'
import type { CategoriaNombre, NuevoTicketInput, ServicioResumen } from '../types/ticket.types'

interface TicketFormProps {
  servicios: ServicioResumen[]
  enviando: boolean
  error?: string | null
  onSubmit: (input: NuevoTicketInput) => void
}

const VACIO: NuevoTicketInput = { titulo: '', descripcion: '', servicioId: null, categoria: null }

export function TicketForm({ servicios, enviando, error, onSubmit }: TicketFormProps) {
  const [valores, setValores] = useState<NuevoTicketInput>(VACIO)
  const [errores, setErrores] = useState<ErroresTicket>({})
  const [intentado, setIntentado] = useState(false)

  const actualizar = (cambios: Partial<NuevoTicketInput>) => {
    const nuevos = { ...valores, ...cambios }
    setValores(nuevos)
    // Después del primer intento, los errores se actualizan mientras se escribe.
    if (intentado) setErrores(validarNuevoTicket(nuevos))
  }

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const encontrados = validarNuevoTicket(valores)
    setIntentado(true)
    setErrores(encontrados)
    if (tieneErrores(encontrados)) {
      document.getElementById(encontrados.titulo ? 'titulo' : 'descripcion')?.focus()
      return
    }
    onSubmit(valores)
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titulo">
          Título <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="titulo"
          value={valores.titulo}
          maxLength={TITULO_MAX}
          onChange={(e) => actualizar({ titulo: e.target.value })}
          placeholder="Ej.: La impresora del segundo piso no imprime"
          aria-invalid={Boolean(errores.titulo)}
          aria-describedby="titulo-ayuda"
          aria-required="true"
          className="h-10"
        />
        <div id="titulo-ayuda" className="flex justify-between gap-3 text-xs">
          {errores.titulo ? (
            <span className="font-medium text-destructive">{errores.titulo}</span>
          ) : (
            <span className="text-muted-foreground">Un resumen corto del problema.</span>
          )}
          <span className="font-mono text-muted-foreground tabular-nums">
            {valores.titulo.length}/{TITULO_MAX}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">
          Descripción <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="descripcion"
          rows={6}
          value={valores.descripcion}
          onChange={(e) => actualizar({ descripcion: e.target.value })}
          placeholder="¿Qué pasó? ¿Desde cuándo? ¿A cuántas personas afecta? ¿Puedes seguir trabajando?"
          aria-invalid={Boolean(errores.descripcion)}
          aria-describedby="descripcion-ayuda"
          aria-required="true"
          className="min-h-36"
        />
        <p id="descripcion-ayuda" className="text-xs">
          {errores.descripcion ? (
            <span className="font-medium text-destructive">{errores.descripcion}</span>
          ) : (
            <span className="text-muted-foreground">Mientras más detalle, mejor se clasifica el ticket.</span>
          )}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="servicio">
          Servicio afectado <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <NativeSelect
          id="servicio"
          value={valores.servicioId ?? ''}
          onChange={(e) => actualizar({ servicioId: e.target.value ? Number(e.target.value) : null })}
          aria-describedby="servicio-ayuda"
          className="h-10"
        >
          <option value="">Ninguno / no sé</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
              {s.esCritico ? ' (crítico)' : ''}
            </option>
          ))}
        </NativeSelect>
        <p id="servicio-ayuda" className="text-xs text-muted-foreground">
          Si es un servicio crítico, el ticket se atiende con mayor prioridad.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoria">
          Categoría <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <NativeSelect
          id="categoria"
          value={valores.categoria ?? ''}
          onChange={(e) => actualizar({ categoria: (e.target.value || null) as CategoriaNombre | null })}
          aria-describedby="categoria-ayuda"
          className="h-10"
        >
          <option value="">No estoy seguro</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_ETIQUETA[c]}
            </option>
          ))}
        </NativeSelect>
        <p id="categoria-ayuda" className="text-xs text-muted-foreground">
          Si no la eliges, la sugiere la IA.
        </p>
      </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
        <Link to="/tickets" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Cancelar
        </Link>
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando && <LoaderCircleIcon className="animate-spin" aria-hidden="true" />}
          {enviando ? 'Creando ticket…' : 'Crear ticket'}
        </Button>
      </div>
    </form>
  )
}
