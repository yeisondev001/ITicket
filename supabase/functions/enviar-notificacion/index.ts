import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Avisa por Telegram cuando un ticket pasa a "escalado". La llama el trigger
// "enviar-notificacion" de la tabla tickets (servidor a servidor), nunca el
// navegador.
//
// Todos los datos sensibles salen de los Secrets de Supabase. Si falta alguno,
// la función no hace nada: nunca hay valores escritos en el código.
//   ITICKET_INTERNAL_TOKEN  token que debe venir en el encabezado x-iticket-token
//   TELEGRAM_BOT_TOKEN      token del bot (de @BotFather)
//   TELEGRAM_CHAT_ID        chat donde se publica el aviso

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

// El título lo escribe el usuario: se escapa para el formato HTML de Telegram.
const escapar = (texto: string) =>
  texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const tokenInterno = Deno.env.get("ITICKET_INTERNAL_TOKEN");
  if (!tokenInterno || req.headers.get("x-iticket-token") !== tokenInterno) {
    return json({ error: "No autorizado" }, 401);
  }

  const tokenBot = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!tokenBot || !chatId) {
    return json({ error: "Faltan los secretos de Telegram en Supabase" }, 500);
  }

  try {
    // Formato de los webhooks de la base de datos: { type, record, old_record }
    const { record, old_record: anterior } = await req.json();
    const pasoAEscalado = record?.estado === "escalado" && anterior?.estado !== "escalado";
    if (!pasoAEscalado) return json({ ok: true, mensaje: "Sin cambios que avisar" }, 200);

    const texto =
      `🚨 <b>Ticket escalado</b>\n\n` +
      `<b>${escapar(String(record.titulo ?? "Sin título"))}</b>\n` +
      `ID: ${Number(record.id)} · Nivel de escalamiento: ${Number(record.nivel_escalamiento ?? 0)}`;

    const respuesta = await fetch(`https://api.telegram.org/bot${tokenBot}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML" }),
    });
    if (!respuesta.ok) {
      return json({ error: "Telegram rechazó el mensaje", detalles: await respuesta.text() }, 502);
    }

    return json({ ok: true, mensaje: "Aviso enviado" }, 200);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Error interno" }, 500);
  }
});
