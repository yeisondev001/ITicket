CREATE OR REPLACE FUNCTION public.crear_servicio_con_playbook(
    p_nombre text,
    p_descripcion text,
    p_es_critico boolean,
    p_rto_minutos integer,
    p_rpo_minutos integer,
    p_titulo_playbook text,
    p_pasos_playbook text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_servicio public.servicios;
  v_playbook public.playbooks;
BEGIN
  IF coalesce(public.rol_actual():: text, '') NOT IN('administrador', 'supervisor') THEN
    RAISE EXCEPTION 'No tienes permisos para registrar servicios';
  END IF;

  IF nullif(trim(p_nombre), '') IS NULL THEN
    RAISE EXCEPTION 'El nombre del servicio es obligatorio';
  END IF;

  IF p_rto_minutos < 0 THEN
    RAISE EXCEPTION 'El RTO no puede ser negativo';
  END IF;

  IF p_rpo_minutos < 0 THEN
    RAISE EXCEPTION 'El RPO no puede ser negativo';
  END IF;

  IF nullif(trim(p_titulo_playbook), '') IS NULL THEN
    RAISE EXCEPTION 'El título del playbook es obligatorio';
  END IF;

  IF nullif(trim(p_pasos_playbook), '') IS NULL THEN
    RAISE EXCEPTION 'Los pasos del playbook son obligatorios';
  END IF;

  INSERT INTO public.servicios(
    nombre,
    descripcion,
    es_critico,
    rto_minutos,
    rpo_minutos
)
VALUES(
    trim(p_nombre),
    nullif(trim(p_descripcion), ''),
    p_es_critico,
    p_rto_minutos,
    p_rpo_minutos
)
RETURNING * INTO v_servicio;

  INSERT INTO public.playbooks(
    servicio_id,
    titulo,
    pasos
)
VALUES(
    v_servicio.id,
    trim(p_titulo_playbook),
    trim(p_pasos_playbook)
)
RETURNING * INTO v_playbook;

  RETURN jsonb_build_object(
    'servicio', to_jsonb(v_servicio),
    'playbook', to_jsonb(v_playbook)
);
END;
$$;

REVOKE ALL ON FUNCTION public.crear_servicio_con_playbook(
    text,
    text,
    boolean,
    integer,
    integer,
    text,
    text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.crear_servicio_con_playbook(
    text,
    text,
    boolean,
    integer,
    integer,
    text,
    text
) TO authenticated;
