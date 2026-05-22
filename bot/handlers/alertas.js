import twilio from 'twilio';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getTodayData, statsFrom, todayStr } from '../data.js';
import { CAT_LABELS } from '../nlp.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG_FILE = join(root, 'data/config.json');

function loadConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return { alertas: { umbral_diario: 8, por_categoria: {} } }; }
}

const alertasFired = new Set();

function client() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function send(to, body) {
  await client().messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to, body });
}

// ── Verificación de umbrales (llamada por cron cada 30 min) ───────

export async function checkAlerts() {
  const manager = process.env.MANAGER_PHONE;
  if (!manager) return;

  const config  = loadConfig();
  const records = getTodayData();
  const stats   = statsFrom(records);
  const hoy     = todayStr();

  // Alerta por total diario
  const keyTotal = `total_${hoy}`;
  if (stats.total >= config.alertas.umbral_diario && !alertasFired.has(keyTotal)) {
    alertasFired.add(keyTotal);
    await send(manager,
      `⚠️ *Alerta de mermas — ${hoy}*\nSe superaron los ${config.alertas.umbral_diario} registros diarios.\nTotal actual: *${stats.total}*`
    );
    console.log(`[alertas] Total diario (${stats.total}) supera umbral`);
  }

  // Alertas por categoría
  for (const [cat, umbral] of Object.entries(config.alertas.por_categoria)) {
    const cnt = stats.cats[cat] || 0;
    const keyCat = `${cat}_${hoy}`;
    if (cnt >= umbral && !alertasFired.has(keyCat)) {
      alertasFired.add(keyCat);
      await send(manager,
        `⚠️ *Alerta — ${CAT_LABELS[cat] || cat}* (${hoy})\n${cnt} registros hoy superan el umbral de ${umbral}.`
      );
      console.log(`[alertas] Categoría ${cat} (${cnt}) supera umbral ${umbral}`);
    }
  }
}

// Resetea alertas fired a medianoche (llamada por cron)
export function resetAlerts() {
  alertasFired.clear();
  console.log('[alertas] Estado de alertas reiniciado');
}
