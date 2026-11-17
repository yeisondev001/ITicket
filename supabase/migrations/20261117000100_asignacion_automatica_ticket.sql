--La carga de trabajo se consulta frecuentemente al asignar tickets.
create index if not exists idx_tickets_asignacion_abiertos
	on public.tickets(asignado_a, estado);

create index if not exists idx_tecnico_categorias_categoria
	on public.tecnico_categorias (categoria_id, tecnico_id);


create or replace function public.asignar_ticket_automaticamente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	tecnico_seleccionado uuid;
begin
	-- Sin categoria no existe una forma válida de elegir técnico.
	if new.categoria_id is null then
		return new;
	end if;

	-- No sobrescribimos una asignación proporcionada explicitamente.
	if new.asignado_a is not null then
		return new;
	end if;

	/*
	 *
	 * Evita que dos tickets de la misma categoria seleccionen
	 * simultaneamente al mismo tecnico con el mismo conteo.
	 */
	 perform pg_advisory_xact_lock(
		hashtextextended(new.categoria_id::text, 0)
	);

	select tc.tecnico_id
		into tecnico_seleccionado
		from public.tecnico_categorias tc
		inner join public.perfiles p
			on p.id = tc.tecnico_id
			and p.rol = 'tecnico'::public.rol_usuario
			and p.activo = true
		left join public.tickets ticket_abierto
			on ticket_abierto.asignado_a = tc.tecnico_id
			and ticket_abierto.estado in (
				'asignado'::public.estado_ticket,
				'en_progreso'::public.estado_ticket,
				'escalado'::public.estado_ticket
			)
  Where tc.categoria_id = new.categoria_id
  group by tc.tecnico_id
  order by count(ticket_abierto.id), tc.tecnico_id
  limit 1;

	if tecnico_seleccionado is not null then
		new.asignado_a := tecnico_seleccionado;
		new.asignado_en := coalesce(new.asignado_en, now());
		new.estado := 'asignado'::public.estado_ticket;
	end if;

	return new;
end;
$$;

drop trigger if exists tickets_asignar_automaticamente
	on public.tickets;

create trigger tickets_asignar_automaticamente
before insert on public.tickets
for each row
execute function public.asignar_ticket_automaticamente();