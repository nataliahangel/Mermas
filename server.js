import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import cron from 'node-cron';
import { handleMessage } from './bot/dispatcher.js';
import { sendDailyReport, sendWeeklyReport } from './bot/handlers/resumen.js';
import { checkAlerts, resetAlerts } from './bot/handlers/alertas.js';
import { getAllData } from './bot/data.js';

const app  = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── Webhook de WhatsApp (Twilio) ──────────────────────────────────

app.post('/webhook', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const phone  = req.body.From;   // "whatsapp:+5491112345678"
  const text   = (req.body.Body || '').trim();

  if (!phone || !text) {
    return res.type('text/xml').send(twiml.toString());
  }

  try {
    const reply = await handleMessage(phone, text);
    if (reply) twiml.message(reply);
  } catch (err) {
    console.error('[webhook] Error:', err);
    twiml.message('⚠️ Ocurrió un error. Intentá de nuevo en un momento.');
  }

  res.type('text/xml').send(twiml.toString());
});

// ── API para el dashboard ─────────────────────────────────────────

app.get('/api/data', (_req, res) => res.json(getAllData()));

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── Cron jobs ─────────────────────────────────────────────────────

const TZ = { timezone: 'America/Argentina/Buenos_Aires' };

// Reporte diario a las 23:00
cron.schedule('0 23 * * *', sendDailyReport, TZ);

// Reporte semanal domingos a las 20:00
cron.schedule('0 20 * * 0', sendWeeklyReport, TZ);

// Verificación de alertas cada 30 minutos
cron.schedule('*/30 * * * *', checkAlerts, TZ);

// Reset de alertas a medianoche
cron.schedule('0 0 * * *', resetAlerts, TZ);

// ── Start ─────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`\n🍽️  Mermas Bot corriendo en puerto ${port}`);
  console.log(`📡  Webhook: POST /webhook`);
  console.log(`📊  API:     GET  /api/data\n`);
});
