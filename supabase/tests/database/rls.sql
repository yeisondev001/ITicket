begin;

GRANT INSERT ON public.tickets TO authenticated;
GRANT SELECT ON public.tickets TO authenticated;
GRANT UPDATE ON public.tickets TO authenticated;
GRANT DELETE ON public.tickets TO authenticated;
GRANT SELECT ON public.categorias TO authenticated;
GRANT SELECT ON public.perfiles TO authenticated;
GRANT UPDATE ON public.perfiles TO authenticated;
GRANT SELECT ON public.tickets TO anon;
GRANT INSERT ON public.comentarios TO authenticated;

create extension if not exists "basejump@supabase_test_helpers";
select plan(31);

-- Usuarios
select tests.create_supabase_user('user1');
select tests.create_supabase_user('user2');
select tests.create_supabase_user('user3');   -- inactivo
select tests.create_supabase_user('tech1');
select tests.create_supabase_user('tech2');
select tests.create_supabase_user('sup');
select tests.create_supabase_user('adm');

insert into public.perfiles (id, nombre, rol, activo) values
  (tests.get_supabase_uid('user1'), 'User 1', 'usuario',       true),
  (tests.get_supabase_uid('user2'), 'User 2', 'usuario',       true),
  (tests.get_supabase_uid('user3'), 'User 3', 'usuario',       false),
  (tests.get_supabase_uid('tech1'), 'Tech 1', 'tecnico',       true),
  (tests.get_supabase_uid('tech2'), 'Tech 2', 'tecnico',       true),
  (tests.get_supabase_uid('sup'),   'Sup',    'supervisor',    true),
  (tests.get_supabase_uid('adm'),   'Adm',    'administrador', true)
on conflict (id) do update
  set rol = excluded.rol, activo = excluded.activo, nombre = excluded.nombre;

insert into public.categorias (nombre) values ('Red-test');

insert into public.tickets (titulo, descripcion, creado_por, asignado_a) values
  ('Tk1','d', tests.get_supabase_uid('user1'), tests.get_supabase_uid('tech1')),
  ('Tk2','d', tests.get_supabase_uid('user1'), null),
  ('Tk3','d', tests.get_supabase_uid('user2'), tests.get_supabase_uid('tech1')),
  ('Tk4','d', tests.get_supabase_uid('user2'), tests.get_supabase_uid('tech2')),
  ('Tk5','d', tests.get_supabase_uid('user3'), null);

-- Los ids son IDENTITY: los guardo para usarlos sin depender de RLS
create temp table tids as select titulo, id from public.tickets;
grant all on tids to authenticated, anon;

-- ================= USUARIO =================
select tests.authenticate_as('user1');

select is((select count(*) from public.tickets where titulo in ('Tk1','Tk2','Tk3','Tk4')),
  2::bigint, '01 usuario: ve solo sus 2 tickets');

select is_empty($$ select 1 from public.tickets where titulo in ('Tk3','Tk4') $$,
  '02 usuario: no ve tickets ajenos');

select results_eq(
  $$ with u as (update public.tickets set descripcion='editada' where titulo='Tk1' returning 1)
     select count(*)::int from u $$, array[1],
  '03 usuario: edita su ticket');

select results_eq(
  $$ with u as (update public.tickets set descripcion='hack' where titulo='Tk3' returning 1)
     select count(*)::int from u $$, array[0],
  '04 usuario: no edita tickets ajenos');

select throws_ok(
  $$ update public.tickets set asignado_a = tests.get_supabase_uid('tech1') where titulo='Tk2' $$,
  'P0001', null, '05 usuario: no puede asignarse tecnico (trigger)');

select throws_ok(
  format($$ insert into public.tickets (titulo, descripcion, creado_por)
            values ('x','d', %L) $$, tests.get_supabase_uid('user2')),
  '42501', null, '06 usuario: no crea tickets a nombre de otro');

select lives_ok(
  format($$ insert into public.tickets (titulo, descripcion, creado_por)
            values ('nuevo','d', %L) $$, tests.get_supabase_uid('user1')),
  '07 usuario: crea su propio ticket');

select results_eq(
  $$ with d as (delete from public.tickets where titulo='Tk1' returning 1)
     select count(*)::int from d $$, array[0],
  '08 usuario: no puede borrar');

select lives_ok(
  format($$ insert into public.comentarios (ticket_id, autor_id, contenido)
            values ((select id from tids where titulo='Tk1'), %L, 'hola') $$,
         tests.get_supabase_uid('user1')),
  '09 usuario: comenta en su ticket');

select throws_ok(
  format($$ insert into public.comentarios (ticket_id, autor_id, contenido)
            values ((select id from tids where titulo='Tk3'), %L, 'hola') $$,
         tests.get_supabase_uid('user1')),
  '42501', null, '10 usuario: no comenta en ticket ajeno');

select ok((select count(*) from public.categorias) >= 1,
  '11 usuario: lee categorias');

select throws_ok($$ insert into public.categorias (nombre) values ('hack') $$,
  '42501', null, '12 usuario: no crea categorias');

select is_empty(
  format($$ select 1 from public.perfiles where id = %L $$, tests.get_supabase_uid('user2')),
  '13 usuario: no ve perfiles no relacionados');

select throws_ok(
  format($$ update public.perfiles set rol='administrador' where id = %L $$,
         tests.get_supabase_uid('user1')),
  'P0001', null, '14 usuario: no puede cambiarse el rol');

-- ================= TÉCNICO =================
select tests.authenticate_as('tech1');

select is((select count(*) from public.tickets where titulo in ('Tk1','Tk2','Tk3','Tk4')),
  2::bigint, '15 tecnico: ve solo los asignados (Tk1, Tk3)');

select is_empty($$ select 1 from public.tickets where titulo='Tk4' $$,
  '16 tecnico: no ve tickets de otro tecnico');

select results_eq(
  $$ with u as (update public.tickets set solucion='ok' where titulo='Tk3' returning 1)
     select count(*)::int from u $$, array[1],
  '17 tecnico: actualiza un ticket asignado');

select results_eq(
  $$ with u as (update public.tickets set solucion='x' where titulo='Tk4' returning 1)
     select count(*)::int from u $$, array[0],
  '18 tecnico: no actualiza tickets no asignados');

select throws_ok(
  $$ update public.tickets set asignado_a = tests.get_supabase_uid('tech2') where titulo='Tk3' $$,
  'P0001', null, '19 tecnico: no puede reasignar (trigger)');

select results_eq(
  $$ with d as (delete from public.tickets where titulo='Tk3' returning 1)
     select count(*)::int from d $$, array[0],
  '20 tecnico: no puede borrar');

select lives_ok(
  format($$ insert into public.comentarios (ticket_id, autor_id, contenido)
            values ((select id from tids where titulo='Tk3'), %L, 'en proceso') $$,
         tests.get_supabase_uid('tech1')),
  '21 tecnico: comenta en ticket asignado');

select throws_ok(
  format($$ insert into public.comentarios (ticket_id, autor_id, contenido)
            values ((select id from tids where titulo='Tk4'), %L, 'x') $$,
         tests.get_supabase_uid('tech1')),
  '42501', null, '22 tecnico: no comenta en ticket no asignado');

-- ================= SUPERVISOR =================
select tests.authenticate_as('sup');

select is((select count(*) from public.tickets where titulo in ('Tk1','Tk2','Tk3','Tk4')),
  4::bigint, '23 supervisor: ve todos');

select results_eq(
  $$ with u as (update public.tickets set solucion='rev' where titulo='Tk4' returning 1)
     select count(*)::int from u $$, array[1],
  '24 supervisor: modifica cualquiera');

select results_eq(
  $$ with u as (update public.tickets set asignado_a = tests.get_supabase_uid('tech1')
                where titulo='Tk2' returning 1)
     select count(*)::int from u $$, array[1],
  '25 supervisor: puede asignar tecnico');

select results_eq(
  $$ with d as (delete from public.tickets where titulo='Tk4' returning 1)
     select count(*)::int from d $$, array[0],
  '26 supervisor: no puede borrar');

-- ================= ADMINISTRADOR =================
select tests.authenticate_as('adm');

select is((select count(*) from public.tickets where titulo in ('Tk1','Tk2','Tk3','Tk4')),
  4::bigint, '27 admin: ve todos');

select results_eq(
  $$ with d as (delete from public.tickets where titulo='Tk4' returning 1)
     select count(*)::int from d $$, array[1],
  '28 admin: puede borrar');

select results_eq(
  format($$ with u as (update public.perfiles set rol='tecnico' where id = %L returning 1)
            select count(*)::int from u $$, tests.get_supabase_uid('user2')),
  array[1], '29 admin: puede cambiar roles');

-- ================= ANÓNIMO / INACTIVO =================
select tests.clear_authentication();
select is((select count(*) from public.tickets), 0::bigint, '30 anon: no ve nada');

select tests.authenticate_as('user3');
select is((select count(*) from public.tickets), 0::bigint,
  '31 usuario inactivo: no ve ni sus propios tickets');

select * from finish();

rollback;