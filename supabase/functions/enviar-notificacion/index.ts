import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido. Solo se acepta POST." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const { tipo, destinatarioTelegram, destinatarioEmail, ticketTitulo, ticketId } = await req.json()

    // 1. Envío por Telegram Bot API
    if (destinatarioTelegram && TELEGRAM_TOKEN) {
      const textoMensaje = tipo === "ESCALAMIENTO"
        ? `🚨 *ALERTA DE ESCALAMIENTO (SLA VENCIDO)* 🚨\n\nEl ticket *${ticketTitulo}* (ID: ${ticketId}) ha superado el tiempo límite y requiere atención inmediata.`
        : `📋 *Nuevo ticket asignado*\n\nSe te ha asignado el ticket: *${ticketTitulo}* (ID: ${ticketId}).`

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: destinatarioTelegram,
          text: textoMensaje,
          parse_mode: "Markdown"
        })
      })
    }

    // 2. Envío de correo formal por Resend (solo en caso de escalamiento al supervisor)
    if (tipo === "ESCALAMIENTO" && destinatarioEmail && RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "ITicket Alertas <onboarding@resend.dev>",
          to: [destinatarioEmail],
          subject: `[ESCALADO] Incidente crítico: ${ticketTitulo}`,
          html: `
            <h2>Alerta de Incumplimiento de SLA</h2>
            <p>El ticket <strong>${ticketTitulo}</strong> (ID: ${ticketId}) ha vencido su tiempo de atención sin resolverse.</p>
            <p>Se ha activado el playbook de recuperación correspondiente.</p>
          `
        })
      })
    }

    return new Response(
      JSON.stringify({ mensaje: "Notificación enviada correctamente" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Error al enviar la notificación" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})