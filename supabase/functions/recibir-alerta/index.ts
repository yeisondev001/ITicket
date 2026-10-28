import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../../types/database.types.ts";

// Recibe las alertas del monitoreo (UptimeRobot) y crea un ticket.
// Exige el encabezado x-iticket-token igual al secreto ITICKET_INTERNAL_TOKEN.

// Caída de un servicio: impacto alto y urgencia alta → P1 en la matriz ITIL,
// con 1 hora de SLA (src/lib/prioridad.ts). Sin sla_vence_en, el cron de
// escalamiento nunca lo vería.
const HORAS_SLA_P1 = 1;

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const tokenInterno = Deno.env.get("ITICKET_INTERNAL_TOKEN");
  if (!tokenInterno || req.headers.get("x-iticket-token") !== tokenInterno) {
    return json({ error: "No autorizado" }, 401);
  }

  try {
    const { alerta_id, servicio, descripcion, detalles } = await req.json();

    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        alerta_id: alerta_id ? String(alerta_id) : null,
        titulo: `Caída de servicio: ${servicio || "Alerta externa"}`,
        descripcion: descripcion || detalles || "Alerta automática recibida desde monitoreo",
        origen: "monitoreo",
        estado: "nuevo",
        impacto: "alto",
        urgencia: "alta",
        prioridad: "P1",
        sla_vence_en: new Date(Date.now() + HORAS_SLA_P1 * 3_600_000).toISOString(),
      })
      .select()
      .single();

    // La misma alerta llegó dos veces: alerta_id es único, el ticket ya existe.
    if (error?.code === "23505") return json({ ok: true, mensaje: "La alerta ya tenía ticket" }, 200);
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true, ticket: data }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error interno" }, 500);
  }
});
