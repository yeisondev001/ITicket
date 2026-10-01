-- #6 Tablas base: perfiles, categorias, tecnico_categorias, tickets y comentarios.
-- Referencia: docs/modelo-de-datos.md

-- =====================================================================
-- Tipos
-- =====================================================================
create type public.rol_usuario as enum ('usuario', 'tecnico', 'supervisor', 'administrador');
create type public.origen_ticket as enum ('usuario', 'monitoreo');
create type public.estado_ticket as enum ('nuevo', 'asignado', 'en_progreso', 'escalado', 'resuelto', 'cerrado');
create type public.nivel_impacto as enum ('alto', 'medio', 'bajo');
create type public.nivel_urgencia as enum ('alta', 'media', 'baja');
create type public.prioridad as enum ('P1', 'P2', 'P3', 'P4');

-- =====================================================================
-- Perfiles: datos propios de cada usuario de Supabase Auth
-- =====================================================================
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'usuario',
  telegram_chat_id text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando alguien se registra.
create function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1), 'Usuario')
  );
  return new;
end;
$$;

revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- =====================================================================
-- Categorías (las mismas que usa la clasificación con IA)
-- =====================================================================
create table public.categorias (
  id smallint generated always as identity primary key,
  nombre text not null unique,
  descripcion text
);

insert into public.categorias (nombre, descripcion) values
  ('red', 'Conectividad, internet, VPN y wifi'),
  ('hardware', 'Equipos, impresoras y periféricos'),
  ('software', 'Aplicaciones y sistemas'),
  ('accesos', 'Usuarios, contraseñas y permisos'),
  ('correo', 'Correo electrónico'),
  ('seguridad', 'Virus, phishing y accesos sospechosos'),
  ('otro', 'Lo que no encaja en otra categoría');

-- =====================================================================
-- Técnicos por categoría
-- =====================================================================
create table public.tecnico_categorias (
  tecnico_id uuid not null references public.perfiles (id) on delete cascade,
  categoria_id smallint not null references public.categorias (id) on delete cascade,
  primary key (tecnico_id, categoria_id)
);

create index tecnico_categorias_categoria_idx on public.tecnico_categorias (categoria_id);

-- =====================================================================
-- Tickets
-- La columna servicio_id se agrega en #23, cuando exista la tabla servicios.
-- =====================================================================
create table public.tickets (
  id bigint generated always as identity primary key,
  titulo text not null check (char_length(titulo) between 3 and 200),
  descripcion text not null,
  origen public.origen_ticket not null default 'usuario',
  alerta_id text unique,
  estado public.estado_ticket not null default 'nuevo',
  categoria_id smallint references public.categorias (id),
  creado_por uuid references public.perfiles (id),
  asignado_a uuid references public.perfiles (id),
  impacto public.nivel_impacto,
  urgencia public.nivel_urgencia,
  prioridad public.prioridad,
  requiere_revision boolean not null default false,
  sla_vence_en timestamptz,
  nivel_escalamiento smallint not null default 0,
  solucion text,
  created_at timestamptz not null default now(),
  asignado_en timestamptz,
  resuelto_en timestamptz,
  cerrado_en timestamptz,
  updated_at timestamptz not null default now(),
  -- Un ticket creado por una persona debe tener su autor; los del monitoreo no.
  constraint tickets_creador_segun_origen
    check (origen = 'monitoreo' or creado_por is not null),
  -- Solo las alertas de monitoreo traen alerta_id.
  constraint tickets_alerta_solo_monitoreo
    check (alerta_id is null or origen = 'monitoreo')
);

create index tickets_estado_idx on public.tickets (estado);
create index tickets_categoria_idx on public.tickets (categoria_id);
create index tickets_creado_por_idx on public.tickets (creado_por);
create index tickets_asignado_a_idx on public.tickets (asignado_a);

-- Mantiene updated_at al día en cada cambio.
create function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_actualizar_updated_at
  before update on public.tickets
  for each row execute function public.actualizar_updated_at();

-- =====================================================================
-- Comentarios
-- =====================================================================
create table public.comentarios (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.tickets (id) on delete cascade,
  autor_id uuid not null references public.perfiles (id),
  contenido text not null check (char_length(contenido) > 0),
  created_at timestamptz not null default now()
);

create index comentarios_ticket_idx on public.comentarios (ticket_id);
create index comentarios_autor_idx on public.comentarios (autor_id);

-- =====================================================================
-- Seguridad: RLS activo y sin políticas.
-- Nadie accede desde la app hasta que #7 defina las políticas por rol.
-- =====================================================================
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.tecnico_categorias enable row level security;
alter table public.tickets enable row level security;
alter table public.comentarios enable row level security;
