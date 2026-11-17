create or replace function public.tomar_ticket(p_ticket_id bigint)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
    ticket_tomado public.tickets;
begin
    update public.tickets t
       set asignado_a = auth.uid(),
           asignado_en = now(),
           estado = 'asignado'::public.estado_ticket,
           updated_at = now()
     where t.id = p_ticket_id
       and t.asignado_a is null
       and exists (
           select 1
             from public.perfiles p
            where p.id = auth.uid()
              and p.rol = 'tecnico'::public.rol_usuario
              and p.activo = true
       )
       and exists (
           select 1
             from public.tecnico_categorias tc
            where tc.tecnico_id = auth.uid()
              and tc.categoria_id = t.categoria_id
       )
    returning t.*
      into ticket_tomado;

    if ticket_tomado.id is null then
        raise exception
            using message =
                'El ticket ya fue tomado o no pertenece a una categoría permitida';
    end if;

    return ticket_tomado;
end;
$$;


revoke all on function public.tomar_ticket(bigint) from public;

grant execute on function public.tomar_ticket(bigint)
    to authenticated;