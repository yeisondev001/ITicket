SET local check_function_bodies = off;

SELECT cron.unschedule('vigilar-sla-tickets');

DROP FUNCTION "public"."revisar_y_escalar_sla"();

DROP EXTENSION "pg_cron";

CREATE EXTENSION "pg_net" SCHEMA "extensions";

CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_nombre text;
begin
  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Sin nombre'
  );

  insert into public.perfiles (id, nombre, rol, activo)
  values (new.id, v_nombre, 'usuario', true)
  on conflict (id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.proteger_columnas_perfil()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if (select auth.uid()) is not null
     and coalesce((select public.rol_actual())::text, '') <> 'administrador'
     and (new.rol is distinct from old.rol or new.activo is distinct from old.activo) then
    raise exception 'Solo un administrador puede cambiar rol o activo';
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.proteger_columnas_ticket()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare
  v_rol public.rol_usuario := public.rol_actual();
begin
  -- Usuario: solo título y descripción
  if v_rol = 'usuario'
     and (to_jsonb(new) - array['titulo','descripcion','updated_at'])
         is distinct from
         (to_jsonb(old) - array['titulo','descripcion','updated_at']) then
    raise exception 'El usuario solo puede editar titulo y descripcion';
  end if;

  -- Técnico: estado, solución y fechas de resolución/cierre
  if v_rol = 'tecnico'
     and (to_jsonb(new) - array['estado','solucion','resuelto_en','cerrado_en','updated_at'])
         is distinct from
         (to_jsonb(old) - array['estado','solucion','resuelto_en','cerrado_en','updated_at']) then
    raise exception 'El tecnico solo puede cambiar estado y solucion';
  end if;

  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.rol_actual()
  RETURNS public.rol_usuario
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select rol from public.perfiles
  where id = (select auth.uid()) and activo
$function$;

CREATE TRIGGER "enviar-notificacion"
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION
    supabase_functions.http_request('https://lwwokrawvwtjuekwuobd.supabase.co/functions/v1/enviar-notificacion', 'POST',
    '{"Content-type":"application/json","x-iticket-token":"iticket_token_secreto_123"}', '{}', '5000');

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';

