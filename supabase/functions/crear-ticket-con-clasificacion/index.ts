import { createClient } from '@supabase/supabase-js'

const CATEGORIAS = ['red', 'hardware', 'software', 'accesos', 'correo', 'seguridad', 'otro'] as const
const IMPACTOS = ['alto', 'medio', 'bajo'] as const
const URGENCIAS = ['alta', 'media', 'baja'] as const
const PRIORIDADES = ['P1', 'P2', 'P3', 'P4'] as const
const SLA_HORAS = { P1: 1, P2: 4, P3: 24, P4: 72 } as const
const UMBRAL_CONFIANZA = 0.75
const MODELO = 'gemini-2.0-flash'

type Categoria = typeof CATEGORIAS[number]
type Impacto = typeof IMPACTOS[number]
type Urgencia = typeof URGENCIAS[number]
type Prioridad = typeof PRIORIDADES[number]

type Clasificacion = {
  categoria: Categoria | null
  impacto: Impacto | null
  urgencia: Urgencia | null
  confianza: number | null
  explicacion: string
}

type Entrada = {
  titulo: string
  descripcion: string
  servicio_id: number | null
  categoria_id: number | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function esUnoDe<T extends readonly string[]>(valor: unknown, valores: T): valor is T[number] {
  return typeof valor === 'string' && valores.includes(valor)
}

function prioridadDe(impacto: Impacto, urgencia: Urgencia, servicioCritico: boolean): Prioridad {
  const matriz: Record<Impacto, Record<Urgencia, Prioridad>> = {
    alto: { alta: 'P1', media: 'P2', baja: 'P3' },
    medio: { alta: 'P2', media: 'P3', baja: 'P4' },
    bajo: { alta: 'P3', media: 'P4', baja: 'P4' },
  }
  const base = matriz[impacto][urgencia]
  if (servicioCritico && (base === 'P3' || base === 'P4')) return 'P2'
  return base
}

function extraerJson(texto: string): unknown {
  const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(limpio)
}

function validarClasificacion(valor: unknown): Clasificacion {
  if (!valor || typeof valor !== 'object') throw new Error('Gemini no devolvió un objeto')
  const dato = valor as Record<string, unknown>
  const confianza = typeof dato.confianza === 'number' ? dato.confianza : null
  if (confianza !== null && (confianza < 0 || confianza > 1)) throw new Error('Confianza fuera de rango')
  if (!esUnoDe(dato.categoria, CATEGORIAS) || !esUnoDe(dato.impacto, IMPACTOS) || !esUnoDe(dato.urgencia, URGENCIAS)) {
    throw new Error('Gemini devolvió valores fuera de los catálogos permitidos')
  }
  if (typeof dato.explicacion !== 'string' || dato.explicacion.length === 0 || dato.explicacion.length > 1000) {
    throw new Error('Explicación inválida')
  }
  return {
    categoria: dato.categoria,
    impacto: dato.impacto,
    urgencia: dato.urgencia,
    confianza,
    explicacion: dato.explicacion,
  }
}

async function clasificarConGemini(entrada: Entrada, servicio: { nombre: string; es_critico: boolean } | null, categoriaManual: string | null): Promise<Clasificacion> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY no está configurada')

  const prompt = `Clasifica este incidente de soporte TI. Devuelve únicamente JSON válido, sin markdown, con exactamente estas propiedades: categoria, impacto, urgencia, confianza, explicacion.
Valores permitidos: categoria=${CATEGORIAS.join(', ')}; impacto=${IMPACTOS.join(', ')}; urgencia=${URGENCIAS.join(', ')}.
confianza debe ser un número entre 0 y 1. No inventes información. La explicación debe tener máximo 300 caracteres.
Título: ${entrada.titulo}
Descripción: ${entrada.descripcion}
Servicio: ${servicio?.nombre ?? 'No indicado'}
Servicio crítico: ${servicio?.es_critico ? 'sí' : 'no'}
Categoría indicada por el usuario: ${categoriaManual ?? 'ninguna'}`

  const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(12000),
  })
  if (!respuesta.ok) throw new Error(`Gemini respondió HTTP ${respuesta.status}`)
  const cuerpo = await respuesta.json()
  const texto = cuerpo.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof texto !== 'string') throw new Error('Gemini no devolvió contenido')
  return validarClasificacion(extraerJson(texto))
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuración de Supabase incompleta' }, 500)

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Autenticación requerida' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { data: usuario, error: errorUsuario } = await admin.auth.getUser(token)
  if (errorUsuario || !usuario.user) return json({ error: 'Sesión inválida' }, 401)

  let entrada: Entrada
  try {
    entrada = await request.json()
    if (typeof entrada.titulo !== 'string' || entrada.titulo.trim().length < 3 || typeof entrada.descripcion !== 'string' || entrada.descripcion.trim().length === 0) {
      return json({ error: 'Título y descripción son obligatorios' }, 400)
    }
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const { data: servicio, error: errorServicio } = entrada.servicio_id
    ? await admin.from('servicios').select('id, nombre, es_critico').eq('id', entrada.servicio_id).maybeSingle()
    : { data: null, error: null }
  if (errorServicio) return json({ error: 'No se pudo consultar el servicio' }, 500)

  const { data: categoriaManual, error: errorCategoria } = entrada.categoria_id
    ? await admin.from('categorias').select('id, nombre').eq('id', entrada.categoria_id).maybeSingle()
    : { data: null, error: null }
  if (errorCategoria || (entrada.categoria_id && !categoriaManual)) return json({ error: 'La categoría no existe' }, 400)

  let clasificacion: Clasificacion | null = null
  let errorClasificacion: string | null = null
  const inicioClasificacion = Date.now()
  try {
    clasificacion = await clasificarConGemini(entrada, servicio, categoriaManual?.nombre ?? null)
  } catch (error) {
    errorClasificacion = error instanceof Error ? error.message : 'Error desconocido al clasificar'
  }

  const categoriaNombre = categoriaManual?.nombre ?? clasificacion?.categoria ?? null
  const { data: categoriaSugerida } = categoriaNombre
    ? await admin.from('categorias').select('id').eq('nombre', categoriaNombre).maybeSingle()
    : { data: null }
  const categoriaFinalId = categoriaManual?.id ?? categoriaSugerida?.id ?? null
  const aceptada = Boolean(clasificacion && clasificacion.confianza !== null && clasificacion.confianza >= UMBRAL_CONFIANZA)
  const completa = Boolean(clasificacion?.impacto && clasificacion?.urgencia)
  const prioridad = completa && aceptada ? prioridadDe(clasificacion!.impacto!, clasificacion!.urgencia!, Boolean(servicio?.es_critico)) : null
  const ahora = new Date()
  const slaVenceEn = prioridad ? new Date(ahora.getTime() + SLA_HORAS[prioridad] * 60 * 60 * 1000).toISOString() : null

  const { data: ticket, error: errorTicket } = await admin.from('tickets').insert({
    titulo: entrada.titulo.trim(),
    descripcion: entrada.descripcion.trim(),
    servicio_id: entrada.servicio_id,
    categoria_id: categoriaFinalId,
    creado_por: usuario.user.id,
    origen: 'usuario',
    impacto: aceptada ? clasificacion?.impacto : null,
    urgencia: aceptada ? clasificacion?.urgencia : null,
    prioridad,
    sla_vence_en: slaVenceEn,
    requiere_revision: !aceptada || Boolean(errorClasificacion),
  }).select('*, categoria:categorias(id, nombre), servicio:servicios(id, nombre, es_critico), creador:perfiles!tickets_creado_por_fkey(id, nombre)').single()

  if (errorTicket || !ticket) return json({ error: errorTicket?.message ?? 'No se pudo crear el ticket' }, 500)

  const { error: errorHistorial } = await admin.from('clasificaciones_ia').insert({
    ticket_id: ticket.id,
    modelo: MODELO,
    categoria_id: categoriaFinalId,
    impacto: clasificacion?.impacto ?? null,
    urgencia: clasificacion?.urgencia ?? null,
    prioridad,
    confianza: clasificacion?.confianza ?? null,
    explicacion: clasificacion?.explicacion ?? 'No fue posible clasificar automáticamente.',
    valida: aceptada && completa,
    error: errorClasificacion,
    intento: 1,
    latencia_ms: Date.now() - inicioClasificacion,
  })
  if (errorHistorial) console.error('No se pudo guardar el historial de IA:', errorHistorial)

  return json({
    ticket: {
      id: ticket.id,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      origen: ticket.origen,
      alertaId: ticket.alerta_id,
      estado: ticket.estado,
      categoria: ticket.categoria?.nombre ?? null,
      servicio: ticket.servicio ? { id: ticket.servicio.id, nombre: ticket.servicio.nombre, esCritico: ticket.servicio.es_critico } : null,
      creadoPor: ticket.creador ? { id: ticket.creador.id, nombre: ticket.creador.nombre } : null,
      asignadoA: null,
      impacto: ticket.impacto,
      urgencia: ticket.urgencia,
      prioridad: ticket.prioridad,
      requiereRevision: ticket.requiere_revision,
      slaVenceEn: ticket.sla_vence_en,
      nivelEscalamiento: ticket.nivel_escalamiento,
      solucion: ticket.solucion,
      createdAt: ticket.created_at,
      asignadoEn: ticket.asignado_en,
      resueltoEn: ticket.resuelto_en,
      cerradoEn: ticket.cerrado_en,
      updatedAt: ticket.updated_at,
    },
  })
})
