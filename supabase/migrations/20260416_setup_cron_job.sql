-- 1. Habilitar las extensiones necesarias
-- pg_cron permite la programación de tareas
-- pg_net permite realizar peticiones HTTP desde SQL
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Eliminar la tarea si ya existe (para evitar duplicados al re-ejecutar)
SELECT cron.unschedule('enviar-recordatorios-cobro');

-- 3. Programar la tarea
-- Se ejecutará todos los días a las 09:00 AM UTC
-- IMPORTANTE: Debes reemplazar [TU_PROJECT_REF] con el ID de tu proyecto 
-- y [TU_SERVICE_ROLE_KEY] con la clave secreta de servicio (Service Role Key).
SELECT cron.schedule(
  'enviar-recordatorios-cobro', -- Nombre de la tarea
  '0 9 * * *',                  -- Expresión Cron (Minuto Hora Día Mes Semana)
  $$
  SELECT net.http_post(
    url := 'https://[TU_PROJECT_REF].supabase.co/functions/v1/send-billing-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [TU_SERVICE_ROLE_KEY]'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  )
  $$
);