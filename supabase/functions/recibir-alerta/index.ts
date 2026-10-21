import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido. Solo se acepta POST." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const body = await req.json()

    const monitorName = body.monitor_name || "Servicio no especificado"
    const errorDetails = body.alert_details || "El servicio externo reportó una caída o falta de respuesta."

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          titulo: `Caída de servicio: ${monitorName}`,
          descripcion: errorDetails,
          origen: "Monitoreo",
          estado: "Nuevo",
          impacto: "Alto",
          urgencia: "Alta",
          prioridad: "P1"
        }
      ])
      .select()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ mensaje: "Ticket creado con éxito por monitoreo", ticket: data }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Error interno al procesar la alerta" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})