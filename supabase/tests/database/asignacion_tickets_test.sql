begin;

select plan(6);

-- Fixture esperado:
-- tecnico_1 cubre categoría 1 y tiene 2 tickets abiertos.
-- tecnico_2 cubre categoría 1 y no tiene tickets abiertos.
-- ticket_nuevo pertenece a categoría 1.

select results_eq(
    $$
        select asignado_a
          from public.tickets
         where id = tests.ticket_id('ticket_nuevo')
    $$,
    $$
        select tests.user_id('tecnico_2')
    $$,
    'Se asigna al técnico con menos tickets abiertos'
);

select results_eq(
    $$
        select estado
          from public.tickets
         where id = tests.ticket_id('ticket_nuevo')
    $$,
    $$
        select 'asignado'::public.estado_ticket
    $$,
    'El ticket pasa a estado asignado'
);

select ok(
    (
        select asignado_en is not null
          from public.tickets
         where id = tests.ticket_id('ticket_nuevo')
    ),
    'Se guarda asignado_en'
);

select throws_ok(
    $$
        select public.tomar_ticket(
            tests.ticket_id('ticket_de_otra_categoria')
        )
    $$,
    'El ticket ya fue tomado o no pertenece a una categoría permitida',
    'Un técnico no puede tomar tickets de otra categoría'
);

select lives_ok(
    $$
        select public.tomar_ticket(
            tests.ticket_id('ticket_sin_asignar')
        )
    $$,
    'Un técnico puede tomar un ticket de su categoría'
);

select is(
    (
        select count(*)
          from public.tickets
         where id = tests.ticket_id('ticket_sin_asignar')
           and asignado_a is not null
    ),
    1::bigint,
    'El ticket queda asignado'
);

select * from finish();

rollback;