import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Acceso rápido a las cuentas de prueba: el login manda solo el correo y esta
// función inicia la sesión con la contraseña guardada en los Secrets. Así la
// contraseña nunca está en el frontend ni en el repositorio.
//
// Secrets de Supabase (Edge Functions → Secrets):
//   ACCESO_PRUEBA_HABILITADO = si   sin esto la función no hace nada (no ponerlo en producción)
//   CUENTAS_PRUEBA_CONTRASENA       contraseña de las cuentas de prueba

const CUENTAS_DE_PRUEBA = new Set([
  "usuario@iticket.dev",
  "tecnico@iticket.dev",
  "supervisor@iticket.dev",
  "admin@iticket.dev",
]);

// Solo responde a la app abierta en local.
function cabecerasCors(origen: string | null): Record<string, string> {
  if (!origen || !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen)) return {};
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const cors = cabecerasCors(req.headers.get("origin"));
  const json = (cuerpo: unknown, status: number) =>
    new Response(JSON.stringify(cuerpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  if (Deno.env.get("ACCESO_PRUEBA_HABILITADO") !== "si") {
    return json({ error: "El acceso de prueba está apagado" }, 403);
  }
  const contrasena = Deno.env.get("CUENTAS_PRUEBA_CONTRASENA");
  if (!contrasena) return json({ error: "Falta CUENTAS_PRUEBA_CONTRASENA en los Secrets" }, 503);

  try {
    const { correo } = await req.json();
    const email = String(correo ?? "").trim().toLowerCase();
    if (!CUENTAS_DE_PRUEBA.has(email)) return json({ error: "No es una cuenta de prueba" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: contrasena });
    if (error || !data.session) return json({ error: "No se pudo iniciar la sesión de prueba" }, 401);

    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }, 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error interno" }, 500);
  }
});
