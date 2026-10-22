import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Validar el token de seguridad interno
  const internalToken = Deno.env.get("ITICKET_INTERNAL_TOKEN");
  const authHeader = req.headers.get("x-iticket-token");

  if (!internalToken || authHeader !== internalToken) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { alerta_id, servicio, descripcion, detalles } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Insertar usando los enums exactos en minúsculas
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        alerta_id: alerta_id || null,
        titulo: `Caída de servicio: ${servicio || "Alerta externa"}`,
        descripcion: descripcion || detalles || "Alerta automática recibida desde monitoreo",
        origen: "monitoreo",
        estado: "nuevo",
        impacto: "alto",
        urgencia: "alta"
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, ticket: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});