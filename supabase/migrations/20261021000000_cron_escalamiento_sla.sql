-- 1. Habilitar la extensión de tareas programadas (pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Función que busca tickets con SLA vencido y cambia su estado a 'Escalado'
CREATE OR REPLACE FUNCTION public.revisar_y_escalar_sla()
RETURNS void AS $$
BEGIN
  UPDATE public.tickets
  SET 
    estado = 'Escalado',
    updated_at = NOW()
  WHERE 
    estado IN ('Nuevo', 'Asignado', 'En proceso')
    AND fecha_limite_sla IS NOT NULL
    AND fecha_limite_sla < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Programar la ejecución automática cada 2 minutos
-- Desprogramar si ya existía para evitar duplicados
SELECT cron.unschedule('vigilar-sla-tickets')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'vigilar-sla-tickets'
);

-- Programar el cron job
SELECT cron.schedule(
  'vigilar-sla-tickets',
  '*/2 * * * *',
  'SELECT public.revisar_y_escalar_sla();'
);