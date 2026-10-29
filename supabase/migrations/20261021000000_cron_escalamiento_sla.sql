-- 1. Habilitar la extensión de tareas programadas (pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Función que busca tickets con SLA vencido y escala su nivel
CREATE OR REPLACE FUNCTION public.revisar_y_escalar_sla()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.tickets
  SET 
    estado = 'escalado',
    nivel_escalamiento = nivel_escalamiento + 1
  WHERE 
    estado IN ('nuevo', 'asignado', 'en_progreso')
    AND sla_vence_en IS NOT NULL
    AND sla_vence_en < now();
END;
$$;

-- Restringir la ejecución para que solo la invoque el cron interno y nunca la API pública
REVOKE EXECUTE ON FUNCTION public.revisar_y_escalar_sla() FROM public, anon, authenticated;

-- 3. Programar la ejecución automática cada 2 minutos
SELECT cron.unschedule('vigilar-sla-tickets')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'vigilar-sla-tickets'
);

SELECT cron.schedule(
  'vigilar-sla-tickets',
  '*/2 * * * *',
  'SELECT public.revisar_y_escalar_sla();'
);