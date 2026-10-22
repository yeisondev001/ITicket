import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // 1. Validar el token de seguridad
  const internalToken = Deno.env.get("ITICKET_INTERNAL_TOKEN");
  const authHeader = req.headers.get("x-iticket-token");

  if (!internalToken || authHeader !== internalToken) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { tipo, destinatarioTelegram, destinatarioEmail, ticketTitulo, ticketId, mensaje } = await req.json();
    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const chatId = destinatarioTelegram || Deno.env.get("TELEGRAM_CHAT_ID");

    // 2. Envío a Telegram si se dispone de credenciales
    if (telegramToken && chatId) {
      const textoTelegram = mensaje || (
        tipo === "ESCALAMIENTO"
          ? `🚨 *ALERTA DE ESCALAMIENTO (SLA VENCIDO)* 🚨\n\nEl ticket *${ticketTitulo}* (ID: ${ticketId}) ha superado el tiempo límite.`
          : `📋 *Nuevo ticket asignado*\n\nSe te ha asignado el ticket: *${ticketTitulo}* (ID: ${ticketId}).`
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
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Envío por Resend si aplica escalamiento por correo
    if (tipo === "ESCALAMIENTO" && destinatarioEmail && resendApiKey) {
      const resResend = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "ITicket Alertas <onboarding@resend.dev>",
          to: [destinatarioEmail],
          subject: `[ESCALADO] Incidente crítico: ${ticketTitulo}`,
          html: `
            <h2>Alerta de Incumplimiento de SLA</h2>
            <p>El ticket <strong>${ticketTitulo}</strong> (ID: ${ticketId}) ha vencido su tiempo de atención sin resolverse.</p>
          `,
        }),
      });

      if (!resResend.ok) {
        const errorData = await resResend.text();
        return new Response(
          JSON.stringify({ error: "Fallo en Resend API", detalles: errorData }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, mensaje: "Notificación procesada exitosamente" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});