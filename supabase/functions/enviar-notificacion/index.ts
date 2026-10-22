import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-iticket-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Manejo de preflight request de CORS (indispensable para llamadas desde el navegador)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Validar el token de seguridad
  const internalToken = Deno.env.get("ITICKET_INTERNAL_TOKEN") || "iticket_token_secreto_123";
  const authHeader = req.headers.get("x-iticket-token");

  if (!authHeader || authHeader !== internalToken) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const record = body.record || {};
    const oldRecord = body.old_record || {};

    const ticketId = body.ticketId || record.id || record.ticket_id || "N/A";
    const ticketTitulo = body.ticketTitulo || record.titulo || record.title || "Sin título";
    const estadoNuevo = record.estado || record.status || body.estado;

    if (body.type === "UPDATE" && estadoNuevo && estadoNuevo.toLowerCase() !== "escalado") {
      return new Response(
        JSON.stringify({ ok: true, mensaje: "Evento ignorado: el ticket no fue escalado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8886501414:AAEuxu58XDDHFvP_WxynfcIobwve_MiFOYw";
    const chatId = body.destinatarioTelegram || Deno.env.get("TELEGRAM_CHAT_ID") || "1350010872";

    const textoTelegram = body.mensaje || (
      `🚨 *ALERTA DE ESCALAMIENTO* 🚨\n\n` +
      `Se ha escalado el ticket: *${ticketTitulo}*\n` +
      `ID: \`${ticketId}\`\n` +
      `Estado: *${estadoNuevo || 'Escalado'}*`
    );

    const resTelegram = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: textoTelegram,
        parse_mode: "Markdown",
      }),
    });

    if (!resTelegram.ok) {
      const errorData = await resTelegram.text();
      return new Response(
        JSON.stringify({ error: "Fallo en Telegram API", detalles: errorData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, mensaje: "Notificación procesada exitosamente" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});