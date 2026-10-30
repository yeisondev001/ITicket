-- Configuración de seguridad, perfil automático y CRUD completo por rol.
-- Complementa rls.sql, que prueba qué tickets ve y cambia cada rol.
begin;

create extension if not exists "basejump@supabase_test_helpers";
select plan(18);

-- ================= CONFIGURACIÓN =================
select is(
  (select count(*)::int from pg_tables
   where schemaname = 'public' and rowsecurity
     and tablename in ('perfiles', 'categorias', 'tecnico_categorias', 'tickets', 'comentarios')),
  5, '01 RLS activo en las 5 tablas');

select is_empty(
  $$ select 1 from pg_policies where schemaname = 'public' and 'anon' = any(roles) $$,
  '02 ninguna política abre datos a anon');

select is(
  (select count(*)::int
   from unnest(array['perfiles', 'categorias', 'tecnico_categorias', 'tickets', 'comentarios']) t,
        unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p
   where has_table_privilege('authenticated', 'public.' || t, p)),
  20, '03 authenticated tiene el permiso base en las 5 tablas');

select is(
  (select count(*)::int
   from unnest(array['perfiles', 'categorias', 'tecnico_categorias', 'tickets', 'comentarios']) t,
        unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p
   where has_table_privilege('anon', 'public.' || t, p)),
  0, '04 anon no tiene permiso sobre ninguna tabla');

select is(
  (select count(*)::int
   from unnest(array['perfiles', 'categorias', 'tecnico_categorias', 'tickets', 'comentarios']) t,
        unnest(array['anon', 'authenticated']) r
   where has_table_privilege(r, 'public.' || t, 'TRUNCATE')),
  0, '05 nadie puede vaciar tablas desde la API');

-- ================= PERFIL AUTOMÁTICO =================
select tests.create_supabase_user('adm');
select tests.create_supabase_user('sup');
select tests.create_supabase_user('usu');

select is(
  (select rol::text from public.perfiles where id = tests.get_supabase_uid('usu')),
  'usuario', '06 al registrarse se crea el perfil con rol usuario');

select is(
  (select count(*)::int from pg_trigger
   where tgrelid = 'auth.users'::regclass and not tgisinternal
     and tgfoid = 'public.crear_perfil_nuevo_usuario'::regproc),
  1, '07 un solo trigger crea el perfil');

update public.perfiles set rol = 'administrador' where id = tests.get_supabase_uid('adm');
update public.perfiles set rol = 'supervisor' where id = tests.get_supabase_uid('sup');

-- Ticket con un comentario, para probar el borrado.
insert into public.tickets (titulo, descripcion, creado_por)
  values ('Con comentario', 'd', tests.get_supabase_uid('usu'));
insert into public.comentarios (ticket_id, autor_id, contenido)
  select id, tests.get_supabase_uid('usu'), 'Primer comentario'
  from public.tickets where titulo = 'Con comentario';

-- ================= CRUD DE CATEGORÍAS =================
select tests.authenticate_as('adm');

select lives_ok(
  $$ insert into public.categorias (nombre, descripcion) values ('prueba-crud', 'd') $$,
  '08 admin: crea una categoría');

select results_eq(
  $$ with u as (update public.categorias set descripcion = 'editada' where nombre = 'prueba-crud' returning 1)
     select count(*)::int from u $$, array[1],
  '09 admin: edita una categoría');

select tests.authenticate_as('sup');

select throws_ok(
  $$ insert into public.categorias (nombre) values ('de-supervisor') $$,
  '42501', null, '10 supervisor: no crea categorías');

select results_eq(
  $$ with b as (delete from public.categorias where nombre = 'prueba-crud' returning 1)
     select count(*)::int from b $$, array[0],
  '11 supervisor: no borra categorías');

select tests.authenticate_as('usu');

select results_eq(
  $$ with u as (update public.categorias set descripcion = 'hack' where nombre = 'prueba-crud' returning 1)
     select count(*)::int from u $$, array[0],
  '12 usuario: no edita categorías');

select tests.authenticate_as('adm');

select results_eq(
  $$ with b as (delete from public.categorias where nombre = 'prueba-crud' returning 1)
     select count(*)::int from b $$, array[1],
  '13 admin: borra una categoría');

-- ================= PERFIL PROPIO =================
select tests.authenticate_as('usu');

select results_eq(
  $$ with u as (update public.perfiles set nombre = 'Nombre nuevo' where id = (select auth.uid()) returning 1)
     select count(*)::int from u $$, array[1],
  '14 usuario: cambia su nombre');

select throws_ok(
  $$ update public.perfiles set activo = false where id = (select auth.uid()) $$,
  'P0001', null, '15 usuario: no se desactiva a sí mismo (trigger)');

-- ================= ELIMINAR TICKET =================
select results_eq(
  $$ with b as (delete from public.comentarios returning 1) select count(*)::int from b $$, array[0],
  '16 usuario: no borra comentarios');

select tests.authenticate_as('adm');

select results_eq(
  $$ with b as (delete from public.tickets where titulo = 'Con comentario' returning 1)
     select count(*)::int from b $$, array[1],
  '17 admin: elimina el ticket');

select tests.clear_authentication();
reset role;

select is(
  (select count(*)::int from public.comentarios where contenido = 'Primer comentario'),
  0, '18 al eliminar el ticket se borran sus comentarios');

select * from finish();

rollback;
