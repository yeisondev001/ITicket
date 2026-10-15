SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE TABLE "public"."categorias" (
  "id"          smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "nombre"      text     NOT NULL,
  "descripcion" text,
  CONSTRAINT "categorias_nombre_key" UNIQUE (nombre),
  CONSTRAINT "categorias_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categorias"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."comentarios" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "ticket_id"  bigint                   NOT NULL,
  "autor_id"   uuid                     NOT NULL,
  "contenido"  text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "comentarios_contenido_check" CHECK ((char_length(contenido) > 0)),
  CONSTRAINT "comentarios_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."comentarios"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."perfiles" (
  "id"               uuid                     NOT NULL,
  "nombre"           text                     NOT NULL,
  "telegram_chat_id" text,
  "activo"           boolean                  NOT NULL DEFAULT true,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "perfiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."perfiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tecnico_categorias" (
  "tecnico_id"   uuid     NOT NULL,
  "categoria_id" smallint NOT NULL,
  CONSTRAINT "tecnico_categorias_pkey" PRIMARY KEY (tecnico_id, categoria_id)
);

ALTER TABLE "public"."tecnico_categorias"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tickets" (
  "id"                 bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "titulo"             text                     NOT NULL,
  "descripcion"        text                     NOT NULL,
  "alerta_id"          text,
  "categoria_id"       smallint,
  "creado_por"         uuid,
  "asignado_a"         uuid,
  "requiere_revision"  boolean                  NOT NULL DEFAULT false,
  "sla_vence_en"       timestamp with time zone,
  "nivel_escalamiento" smallint                 NOT NULL DEFAULT 0,
  "solucion"           text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "asignado_en"        timestamp with time zone,
  "resuelto_en"        timestamp with time zone,
  "cerrado_en"         timestamp with time zone,
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "tickets_alerta_id_key" UNIQUE (alerta_id),
  CONSTRAINT "tickets_pkey" PRIMARY KEY (id),
  CONSTRAINT "tickets_titulo_check" CHECK (((char_length(titulo) >= 3) AND (char_length(titulo) <= 200)))
);

ALTER TABLE "public"."tickets"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SEQUENCE "public"."categorias_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."categorias_id_seq" FROM "authenticated";

REVOKE ALL ON SEQUENCE "public"."categorias_id_seq" FROM "service_role";

REVOKE ALL ON SEQUENCE "public"."comentarios_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."comentarios_id_seq" FROM "authenticated";

REVOKE ALL ON SEQUENCE "public"."comentarios_id_seq" FROM "service_role";

REVOKE ALL ON SEQUENCE "public"."tickets_id_seq" FROM "anon";

REVOKE ALL ON SEQUENCE "public"."tickets_id_seq" FROM "authenticated";

REVOKE ALL ON SEQUENCE "public"."tickets_id_seq" FROM "service_role";

CREATE TYPE "public"."estado_ticket" AS ENUM (
  'nuevo',
  'asignado',
  'en_progreso',
  'escalado',
  'resuelto',
  'cerrado'
);

ALTER TABLE "public"."tickets"
  ADD COLUMN "estado" public.estado_ticket NOT NULL DEFAULT 'nuevo'::public.estado_ticket;

CREATE TYPE "public"."nivel_impacto" AS ENUM (
  'alto',
  'medio',
  'bajo'
);

ALTER TABLE "public"."tickets"
  ADD COLUMN "impacto" public.nivel_impacto;

CREATE TYPE "public"."nivel_urgencia" AS ENUM (
  'alta',
  'media',
  'baja'
);

ALTER TABLE "public"."tickets"
  ADD COLUMN "urgencia" public.nivel_urgencia;

CREATE TYPE "public"."origen_ticket" AS ENUM (
  'usuario',
  'monitoreo'
);

ALTER TABLE "public"."tickets"
  ADD COLUMN "origen" public.origen_ticket NOT NULL DEFAULT 'usuario'::public.origen_ticket;

CREATE TYPE "public"."prioridad" AS ENUM (
  'P1',
  'P2',
  'P3',
  'P4'
);

ALTER TABLE "public"."tickets"
  ADD COLUMN "prioridad" public.prioridad;

CREATE TYPE "public"."rol_usuario" AS ENUM (
  'usuario',
  'tecnico',
  'supervisor',
  'administrador'
);

ALTER TABLE "public"."perfiles"
  ADD COLUMN "rol" public.rol_usuario NOT NULL DEFAULT 'usuario'::public.rol_usuario;

CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."actualizar_updated_at"() FROM "anon", "authenticated", "service_role";

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

REVOKE ALL ON FUNCTION "public"."crear_perfil_nuevo_usuario"() FROM PUBLIC, "anon", "authenticated", "service_role";

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

REVOKE ALL ON FUNCTION "public"."proteger_columnas_perfil"() FROM "anon", "authenticated", "service_role";

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

REVOKE ALL ON FUNCTION "public"."proteger_columnas_ticket"() FROM "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";

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

REVOKE ALL ON FUNCTION "public"."rol_actual"() FROM PUBLIC, "anon", "service_role";

ALTER TABLE "public"."perfiles"
  ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."comentarios"
  ADD CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY (autor_id) REFERENCES public.perfiles(id);

ALTER TABLE "public"."tecnico_categorias"
  ADD CONSTRAINT "tecnico_categorias_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE CASCADE;

ALTER TABLE "public"."tecnico_categorias"
  ADD CONSTRAINT "tecnico_categorias_tecnico_id_fkey" FOREIGN KEY (tecnico_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_alerta_solo_monitoreo" CHECK (((alerta_id IS NULL) OR (origen = 'monitoreo'::public.origen_ticket)));

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_asignado_a_fkey" FOREIGN KEY (asignado_a) REFERENCES public.perfiles(id);

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.perfiles(id);

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_creador_segun_origen" CHECK (((origen = 'monitoreo'::public.origen_ticket) OR (creado_por IS NOT NULL)));

ALTER TABLE "public"."comentarios"
  ADD CONSTRAINT "comentarios_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

CREATE INDEX comentarios_autor_idx ON public.comentarios USING btree (autor_id);

CREATE INDEX comentarios_ticket_idx ON public.comentarios USING btree (ticket_id);

CREATE INDEX tecnico_categorias_categoria_idx ON public.tecnico_categorias USING btree (categoria_id);

CREATE INDEX tickets_asignado_a_idx ON public.tickets USING btree (asignado_a);

CREATE INDEX tickets_categoria_idx ON public.tickets USING btree (categoria_id);

CREATE INDEX tickets_creado_por_idx ON public.tickets USING btree (creado_por);

CREATE INDEX tickets_estado_idx ON public.tickets USING btree (estado);

CREATE TRIGGER al_crear_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_perfil_nuevo_usuario();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_perfil_nuevo_usuario();

CREATE TRIGGER perfiles_proteger_columnas
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_columnas_perfil();

CREATE TRIGGER tickets_actualizar_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

CREATE TRIGGER tickets_proteger_columnas
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_columnas_ticket();

CREATE POLICY "categorias_admin" ON "public"."categorias"
  FOR ALL
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario))
  WITH CHECK ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario));

CREATE POLICY "categorias_select" ON "public"."categorias"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "comentarios_delete_admin" ON "public"."comentarios"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario));

CREATE POLICY "comentarios_insert" ON "public"."comentarios"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((autor_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.tickets t
  WHERE (t.id = comentarios.ticket_id)))));

CREATE POLICY "comentarios_select" ON "public"."comentarios"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.tickets t
  WHERE (t.id = comentarios.ticket_id))));

CREATE POLICY "perfiles_select" ON "public"."perfiles"
  FOR SELECT
  TO "authenticated"
  USING
    (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT public.rol_actual() AS rol_actual) = ANY (ARRAY['supervisor'::public.rol_usuario, 'administrador'::public.rol_usuario])) OR
    (EXISTS ( SELECT 1
   FROM public.tickets t
  WHERE ((t.creado_por = perfiles.id) OR (t.asignado_a = perfiles.id))))));

CREATE POLICY "perfiles_update_admin" ON "public"."perfiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario))
  WITH CHECK ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario));

CREATE POLICY "perfiles_update_own" ON "public"."perfiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "tec_cat_admin" ON "public"."tecnico_categorias"
  FOR ALL
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario))
  WITH CHECK ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario));

CREATE POLICY "tec_cat_select" ON "public"."tecnico_categorias"
  FOR SELECT
  TO "authenticated"
  USING
    (((tecnico_id = ( SELECT auth.uid() AS uid)) OR (( SELECT public.rol_actual() AS rol_actual) = ANY (ARRAY['supervisor'::public.rol_usuario,
    'administrador'::public.rol_usuario]))));

CREATE POLICY "tickets_delete_admin" ON "public"."tickets"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = 'administrador'::public.rol_usuario));

CREATE POLICY "tickets_insert_staff" ON "public"."tickets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT public.rol_actual() AS rol_actual) = ANY (ARRAY['supervisor'::public.rol_usuario, 'administrador'::public.rol_usuario])));

CREATE POLICY "tickets_insert_usuario" ON "public"."tickets"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((( SELECT public.rol_actual() AS rol_actual) = 'usuario'::public.rol_usuario) AND (creado_por = ( SELECT auth.uid() AS uid)) AND (asignado_a IS NULL) AND (origen =
    'usuario'::public.origen_ticket)));

CREATE POLICY "tickets_select_staff" ON "public"."tickets"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = ANY (ARRAY['supervisor'::public.rol_usuario, 'administrador'::public.rol_usuario])));

CREATE POLICY "tickets_select_tecnico" ON "public"."tickets"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT public.rol_actual() AS rol_actual) = 'tecnico'::public.rol_usuario) AND (asignado_a = ( SELECT auth.uid() AS uid))));

CREATE POLICY "tickets_select_usuario" ON "public"."tickets"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT public.rol_actual() AS rol_actual) = 'usuario'::public.rol_usuario) AND (creado_por = ( SELECT auth.uid() AS uid))));

CREATE POLICY "tickets_update_staff" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT public.rol_actual() AS rol_actual) = ANY (ARRAY['supervisor'::public.rol_usuario, 'administrador'::public.rol_usuario])))
  WITH CHECK ((( SELECT public.rol_actual() AS rol_actual) = ANY (ARRAY['supervisor'::public.rol_usuario, 'administrador'::public.rol_usuario])));

CREATE POLICY "tickets_update_tecnico" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT public.rol_actual() AS rol_actual) = 'tecnico'::public.rol_usuario) AND (asignado_a = ( SELECT auth.uid() AS uid))))
  WITH CHECK ((asignado_a = ( SELECT auth.uid() AS uid)));

CREATE POLICY "tickets_update_usuario" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING
    (((( SELECT public.rol_actual() AS rol_actual) = 'usuario'::public.rol_usuario) AND (creado_por = ( SELECT auth.uid() AS uid)) AND (estado = 'nuevo'::public.estado_ticket)))
  WITH CHECK ((creado_por = ( SELECT auth.uid() AS uid)));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."actualizar_updated_at"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."actualizar_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."actualizar_updated_at"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."crear_perfil_nuevo_usuario"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."crear_perfil_nuevo_usuario"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."proteger_columnas_perfil"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."proteger_columnas_perfil"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."proteger_columnas_perfil"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."proteger_columnas_ticket"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."proteger_columnas_ticket"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."proteger_columnas_ticket"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rol_actual"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."rol_actual"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rol_actual"() TO "postgres";

REVOKE ALL ON TABLE "public"."categorias" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."categorias" TO "anon";

REVOKE ALL ON TABLE "public"."categorias" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."categorias" TO "authenticated";

REVOKE ALL ON TABLE "public"."categorias" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categorias" TO "postgres";

REVOKE ALL ON TABLE "public"."categorias" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."categorias" TO "service_role";

REVOKE ALL ON TABLE "public"."comentarios" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."comentarios" TO "anon";

REVOKE ALL ON TABLE "public"."comentarios" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."comentarios" TO "authenticated";

REVOKE ALL ON TABLE "public"."comentarios" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comentarios" TO "postgres";

REVOKE ALL ON TABLE "public"."comentarios" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."comentarios" TO "service_role";

REVOKE ALL ON TABLE "public"."perfiles" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."perfiles" TO "anon";

REVOKE ALL ON TABLE "public"."perfiles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."perfiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."perfiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."perfiles" TO "postgres";

REVOKE ALL ON TABLE "public"."perfiles" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."perfiles" TO "service_role";

REVOKE ALL ON TABLE "public"."tecnico_categorias" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tecnico_categorias" TO "anon";

REVOKE ALL ON TABLE "public"."tecnico_categorias" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tecnico_categorias" TO "authenticated";

REVOKE ALL ON TABLE "public"."tecnico_categorias" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tecnico_categorias" TO "postgres";

REVOKE ALL ON TABLE "public"."tecnico_categorias" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tecnico_categorias" TO "service_role";

REVOKE ALL ON TABLE "public"."tickets" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tickets" TO "anon";

REVOKE ALL ON TABLE "public"."tickets" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tickets" TO "authenticated";

REVOKE ALL ON TABLE "public"."tickets" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tickets" TO "postgres";

REVOKE ALL ON TABLE "public"."tickets" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tickets" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";


--postgresql://postgres:Yeison123.@db.lwwokrawvwtjuekwuobd.supabase.co:5432/postgres