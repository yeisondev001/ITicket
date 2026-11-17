CREATE TABLE public.clasificaciones_ia (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id bigint NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  modelo text NOT NULL,
  categoria_id smallint REFERENCES public.categorias(id),
  impacto public.nivel_impacto,
  urgencia public.nivel_urgencia,
  prioridad public.prioridad,
  confianza numeric(4,3) CHECK (confianza IS NULL OR (confianza >= 0 AND confianza <= 1)),
  explicacion text NOT NULL DEFAULT '',
  valida boolean NOT NULL DEFAULT false,
  intento smallint NOT NULL DEFAULT 1 CHECK (intento > 0),
  latencia_ms integer CHECK (latencia_ms IS NULL OR latencia_ms >= 0),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX clasificaciones_ia_ticket_idx ON public.clasificaciones_ia(ticket_id, created_at DESC);

ALTER TABLE public.clasificaciones_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clasificaciones_ia_select" ON public.clasificaciones_ia
  FOR SELECT TO authenticated
  USING (EXISTS (
	SELECT 1 FROM public.tickets t
	WHERE t.id = clasificaciones_ia.ticket_id
  ));

CREATE POLICY "clasificaciones_ia_admin" ON public.clasificaciones_ia
  FOR ALL TO authenticated
  USING (public.rol_actual() = 'administrador'::public.rol_usuario)
  WITH CHECK (public.rol_actual() = 'administrador'::public.rol_usuario);

REVOKE ALL ON TABLE public.clasificaciones_ia FROM anon;
GRANT SELECT ON TABLE public.clasificaciones_ia TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.clasificaciones_ia_id_seq TO service_role;
