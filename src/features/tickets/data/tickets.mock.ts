import { SLA_HORAS } from '@/lib/prioridad'
import type {
  ActividadTicket,
  CategoriaNombre,
  ClasificacionIA,
  PersonaResumen,
  ServicioResumen,
  Ticket,
  TicketPrioridad,
} from '../types/ticket.types'

// Datos de prueba para trabajar sin backend. Las fechas se calculan desde el
// momento en que carga la app para que los contadores de SLA tengan sentido.

const BASE = Date.now()
const MINUTO = 60_000
const haceMin = (min: number) => new Date(BASE - min * MINUTO).toISOString()
const venceSla = (creadoHaceMin: number, prioridad: TicketPrioridad) =>
  new Date(BASE - creadoHaceMin * MINUTO + SLA_HORAS[prioridad] * 60 * MINUTO).toISOString()

export const STARLYN: PersonaResumen = { id: 'mock-tecnico-1', nombre: 'Starlyn' }
export const CARLOS: PersonaResumen = { id: 'mock-tecnico-2', nombre: 'Carlos Rodríguez' }
export const ANA: PersonaResumen = { id: 'mock-tecnico-3', nombre: 'Ana Martínez' }
export const JUAN: PersonaResumen = { id: 'mock-tecnico-4', nombre: 'Juan Pérez' }
const MARIA: PersonaResumen = { id: 'mock-usuario-1', nombre: 'María López' }
const PEDRO: PersonaResumen = { id: 'mock-usuario-2', nombre: 'Pedro Gómez' }

// Equivale a la tabla servicios (catálogo de continuidad de negocio).
export const SERVICIOS_MOCK: ServicioResumen[] = [
  { id: 1, nombre: 'Correo electrónico', esCritico: true },
  { id: 2, nombre: 'VPN corporativa', esCritico: true },
  { id: 3, nombre: 'Sistema de nómina', esCritico: true },
  { id: 4, nombre: 'Wifi de oficinas', esCritico: false },
  { id: 5, nombre: 'Impresoras', esCritico: false },
]
const servicio = (id: number) => SERVICIOS_MOCK.find((s) => s.id === id) ?? null

// Equivale a la tabla tecnico_categorias.
export const CATEGORIAS_POR_TECNICO: Record<string, CategoriaNombre[]> = {
  [STARLYN.id]: ['red', 'hardware', 'correo'],
  [CARLOS.id]: ['seguridad', 'correo'],
  [ANA.id]: ['software', 'accesos'],
  [JUAN.id]: ['accesos', 'otro'],
}

interface Semilla {
  id: number
  titulo: string
  descripcion: string
  categoria: CategoriaNombre
  servicioId?: number
  prioridad: TicketPrioridad
  estado: Ticket['estado']
  creadoHace: number
  creadoPor: PersonaResumen | null
  asignadoA: PersonaResumen | null
  resueltoHace?: number
  cerradoHace?: number
  requiereRevision?: boolean
  nivelEscalamiento?: number
  solucion?: string
}

const IMPACTO_URGENCIA: Record<TicketPrioridad, Pick<Ticket, 'impacto' | 'urgencia'>> = {
  P1: { impacto: 'alto', urgencia: 'alta' },
  P2: { impacto: 'alto', urgencia: 'media' },
  P3: { impacto: 'medio', urgencia: 'media' },
  P4: { impacto: 'bajo', urgencia: 'baja' },
}

function crearTicket(s: Semilla): Ticket {
  const monitoreo = s.creadoPor === null
  return {
    id: s.id,
    titulo: s.titulo,
    descripcion: s.descripcion,
    origen: monitoreo ? 'monitoreo' : 'usuario',
    alertaId: monitoreo ? `alerta-${s.id}` : null,
    estado: s.estado,
    categoria: s.categoria,
    servicio: s.servicioId ? servicio(s.servicioId) : null,
    creadoPor: s.creadoPor,
    asignadoA: s.asignadoA,
    ...IMPACTO_URGENCIA[s.prioridad],
    prioridad: s.prioridad,
    requiereRevision: s.requiereRevision ?? false,
    slaVenceEn: venceSla(s.creadoHace, s.prioridad),
    nivelEscalamiento: s.nivelEscalamiento ?? 0,
    solucion: s.solucion ?? null,
    createdAt: haceMin(s.creadoHace),
    asignadoEn: s.asignadoA ? haceMin(s.creadoHace - 3) : null,
    resueltoEn: s.resueltoHace !== undefined ? haceMin(s.resueltoHace) : null,
    cerradoEn: s.cerradoHace !== undefined ? haceMin(s.cerradoHace) : null,
    updatedAt: haceMin(Math.min(s.creadoHace, s.resueltoHace ?? s.creadoHace)),
  }
}

export const TICKETS_MOCK: Ticket[] = [
  crearTicket({
    id: 1042,
    servicioId: 1,
    titulo: 'Servidor de correo no responde',
    descripcion:
      'Alerta automática del monitoreo: el servidor de correo no responde a las comprobaciones de salud. Los usuarios no pueden enviar ni recibir correos.',
    categoria: 'correo',
    prioridad: 'P1',
    estado: 'en_progreso',
    creadoHace: 47,
    creadoPor: null,
    asignadoA: STARLYN,
  }),
  crearTicket({
    id: 1041,
    servicioId: 2,
    titulo: 'VPN se desconecta cada pocos minutos',
    descripcion: 'Desde esta mañana la VPN se cae cada 5 o 10 minutos. Afecta a todo el equipo que trabaja remoto.',
    categoria: 'red',
    prioridad: 'P2',
    estado: 'asignado',
    creadoHace: 75,
    creadoPor: MARIA,
    asignadoA: STARLYN,
  }),
  crearTicket({
    id: 1040,
    servicioId: 5,
    titulo: 'Impresora del segundo piso no imprime',
    descripcion: 'La impresora recibe los trabajos pero no imprime nada. Ya la reinicié.',
    categoria: 'hardware',
    prioridad: 'P3',
    estado: 'nuevo',
    creadoHace: 170,
    creadoPor: PEDRO,
    asignadoA: null,
    requiereRevision: true,
  }),
  crearTicket({
    id: 1039,
    servicioId: 3,
    titulo: 'No puedo acceder al sistema de nómina',
    descripcion: 'Al iniciar sesión dice "usuario bloqueado". Necesito cerrar la nómina hoy.',
    categoria: 'accesos',
    prioridad: 'P2',
    estado: 'escalado',
    creadoHace: 272,
    creadoPor: MARIA,
    asignadoA: JUAN,
    nivelEscalamiento: 1,
  }),
  crearTicket({
    id: 1038,
    titulo: 'Correo sospechoso solicitando contraseña',
    descripcion: 'Varios compañeros recibieron un correo que pide confirmar la contraseña en un enlace externo.',
    categoria: 'seguridad',
    prioridad: 'P1',
    estado: 'asignado',
    creadoHace: 50,
    creadoPor: PEDRO,
    asignadoA: CARLOS,
  }),
  crearTicket({
    id: 1044,
    servicioId: 4,
    titulo: 'Wifi lento en sala de reuniones',
    descripcion: 'La conexión inalámbrica en la sala B es muy lenta durante las videollamadas.',
    categoria: 'red',
    prioridad: 'P3',
    estado: 'nuevo',
    creadoHace: 20,
    creadoPor: MARIA,
    asignadoA: null,
  }),
  crearTicket({
    id: 1037,
    titulo: 'Excel se cierra al abrir archivos compartidos',
    descripcion: 'Excel se cierra solo al abrir archivos desde la carpeta compartida de Finanzas.',
    categoria: 'software',
    prioridad: 'P4',
    estado: 'en_progreso',
    creadoHace: 1200,
    creadoPor: PEDRO,
    asignadoA: ANA,
  }),
  crearTicket({
    id: 1036,
    titulo: 'Monitor parpadea al conectar por HDMI',
    descripcion: 'El monitor externo parpadea cada pocos segundos.',
    categoria: 'hardware',
    prioridad: 'P4',
    estado: 'resuelto',
    creadoHace: 2880,
    creadoPor: MARIA,
    asignadoA: STARLYN,
    resueltoHace: 1500,
    solucion: 'Se reemplazó el cable HDMI dañado.',
  }),
  crearTicket({
    id: 1035,
    titulo: 'Crear usuario para nuevo empleado',
    descripcion: 'Ingresa un nuevo analista el lunes; necesita usuario de red y correo.',
    categoria: 'accesos',
    prioridad: 'P3',
    estado: 'cerrado',
    creadoHace: 4320,
    creadoPor: PEDRO,
    asignadoA: ANA,
    resueltoHace: 3800,
    cerradoHace: 3700,
    solucion: 'Usuario y buzón creados; credenciales entregadas al supervisor.',
  }),
]

export const CLASIFICACIONES_MOCK: ClasificacionIA[] = TICKETS_MOCK.map((t, i) => ({
  id: i + 1,
  ticketId: t.id,
  modelo: 'mock',
  categoria: t.categoria,
  impacto: t.impacto,
  urgencia: t.urgencia,
  prioridad: t.prioridad,
  confianza: t.requiereRevision ? 0.48 : 0.92,
  explicacion: t.requiereRevision
    ? 'La descripción no deja claro cuántas personas se ven afectadas.'
    : 'La categoría y el alcance se deducen claramente de la descripción.',
  valida: true,
  createdAt: t.createdAt,
}))

export function actividadInicial(t: Ticket): ActividadTicket[] {
  const lista: ActividadTicket[] = [
    {
      id: `${t.id}-creado`,
      ticketId: t.id,
      tipo: 'creado',
      autor: t.creadoPor?.nombre ?? 'Monitoreo',
      descripcion: t.creadoPor ? 'creó el ticket' : 'creó el ticket desde una alerta',
      createdAt: t.createdAt,
    },
    {
      id: `${t.id}-clasificado`,
      ticketId: t.id,
      tipo: 'clasificado',
      autor: 'Clasificación IA',
      descripcion: `lo clasificó como ${t.categoria ?? 'sin categoría'} · ${t.prioridad ?? 'sin prioridad'}`,
      createdAt: t.createdAt,
    },
  ]
  if (t.asignadoA && t.asignadoEn) {
    lista.push({
      id: `${t.id}-asignado`,
      ticketId: t.id,
      tipo: 'asignado',
      autor: 'Sistema',
      descripcion: `lo asignó a ${t.asignadoA.nombre}`,
      createdAt: t.asignadoEn,
    })
  }
  if (t.id === 1042) {
    lista.push({
      id: '1042-c1',
      ticketId: t.id,
      tipo: 'comentario',
      autor: STARLYN.nombre,
      descripcion: 'comentó',
      comentario: 'Reviso el servidor. El disco está al 98 %; libero espacio y reinicio el servicio.',
      createdAt: haceMin(30),
    })
  }
  if (t.nivelEscalamiento > 0) {
    lista.push({
      id: `${t.id}-escalado`,
      ticketId: t.id,
      tipo: 'escalado',
      autor: 'Sistema',
      descripcion: 'lo escaló al supervisor porque venció el SLA',
      createdAt: t.slaVenceEn ?? t.updatedAt,
    })
  }
  if (t.resueltoEn) {
    lista.push({
      id: `${t.id}-resuelto`,
      ticketId: t.id,
      tipo: 'resuelto',
      autor: t.asignadoA?.nombre ?? 'Sistema',
      descripcion: 'lo marcó como resuelto',
      comentario: t.solucion ?? undefined,
      createdAt: t.resueltoEn,
    })
  }
  return lista
}
