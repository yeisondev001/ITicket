-- Catálogo de servicios críticos y procedimientos de recuperación.
--
-- Idempotente: en el proyecto de pruebas parte de estos objetos se crearon desde
-- la web de Supabase antes de esta migración. Así funciona igual allí que en
-- una base nueva (CI o producción).

CREATE TABLE IF NOT EXISTS public.servicios (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  es_critico boolean NOT NULL DEFAULT false,
  rto_minutos integer NOT NULL,
  rpo_minutos integer NOT NULL,
  CONSTRAINT servicios_nombre_key UNIQUE (nombre),
  CONSTRAINT servicios_nombre_check CHECK (char_length(trim(nombre)) > 0),
  CONSTRAINT servicios_rto_check CHECK (rto_minutos >= 0),
  CONSTRAINT servicios_rpo_check CHECK (rpo_minutos >= 0)
);

CREATE TABLE IF NOT EXISTS public.playbooks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  servicio_id bigint NOT NULL,
  titulo text NOT NULL,
  pasos text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT playbooks_servicio_id_key UNIQUE (servicio_id),
  CONSTRAINT playbooks_servicio_id_fkey
    FOREIGN KEY (servicio_id)
    REFERENCES public.servicios(id)
    ON DELETE RESTRICT,
  CONSTRAINT playbooks_titulo_check CHECK (char_length(trim(titulo)) > 0),
  CONSTRAINT playbooks_pasos_check CHECK (char_length(trim(pasos)) > 0)
);

ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS servicios_es_critico_idx ON public.servicios (es_critico);

DROP TRIGGER IF EXISTS playbooks_actualizar_updated_at ON public.playbooks;
CREATE TRIGGER playbooks_actualizar_updated_at
  BEFORE UPDATE ON public.playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

-- Usuarios autenticados pueden consultar el catálogo para seleccionar servicios
-- y consultar el procedimiento al atender un ticket escalado.
DROP POLICY IF EXISTS servicios_select ON public.servicios;
CREATE POLICY servicios_select
  ON public.servicios
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS playbooks_select ON public.playbooks;
CREATE POLICY playbooks_select
  ON public.playbooks
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo supervisores y administradores administran el catálogo.
DROP POLICY IF EXISTS servicios_manage ON public.servicios;
CREATE POLICY servicios_manage
  ON public.servicios
  FOR ALL
  TO authenticated
  USING (
    public.rol_actual() IN (
      'supervisor'::public.rol_usuario,
      'administrador'::public.rol_usuario
    )
  )
  WITH CHECK (
    public.rol_actual() IN (
      'supervisor'::public.rol_usuario,
      'administrador'::public.rol_usuario
    )
  );

DROP POLICY IF EXISTS playbooks_manage ON public.playbooks;
CREATE POLICY playbooks_manage
  ON public.playbooks
  FOR ALL
  TO authenticated
  USING (
    public.rol_actual() IN (
      'supervisor'::public.rol_usuario,
      'administrador'::public.rol_usuario
    )
  )
  WITH CHECK (
    public.rol_actual() IN (
      'supervisor'::public.rol_usuario,
      'administrador'::public.rol_usuario
    )
  );

-- Permiso base de la API (las políticas RLS siguen filtrando las filas).
-- Sin esto, toda consulta desde la app falla con "permission denied".
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicios, public.playbooks TO authenticated;
REVOKE ALL ON public.servicios, public.playbooks FROM anon;
REVOKE TRUNCATE ON public.servicios, public.playbooks FROM authenticated;

GRANT USAGE, SELECT
  ON SEQUENCE public.servicios_id_seq, public.playbooks_id_seq
  TO authenticated;
