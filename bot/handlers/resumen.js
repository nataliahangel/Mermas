import twilio from 'twilio';
import { getTodayData, getWeekData, statsFrom, todayStr } from '../data.js';
import { formatCats } from './consultar.js';

function client() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function send(to, body) {
  await client().messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to, body });
}

// ── Resumen diario (llamado por cron a las 23hs) ──────────────────

export async function sendDailyReport() {
  const records = getTodayData();
  const manager = process.env.MANAGER_PHONE;
  if (!manager) return;

  if (!records.length) {
    await send(manager, `📊 *Reporte diario — ${todayStr()}*\n\nSin mermas registradas hoy.`);
    return;
  }

  const stats = statsFrom(records);
  let msg = `📊 *Reporte diario — ${todayStr()}*\n`;
  msg += `Total registros: *${stats.total}*\n\n`;
  msg += formatCats(stats.cats);
  msg += '\n*Top insumos:*\n';
  for (const [ins, cnt] of stats.topInsumos) msg += `  • ${ins}: ${cnt}\n`;
  msg += '\n*Por persona:*\n';
  for (const [r, cnt] of stats.topResps) msg += `  • ${r}: ${cnt}\n`;

  await send(manager, msg.trim());
  console.log(`[cron] Reporte diario enviado a ${manager}`);
}

// ── Resumen semanal (llamado por cron los domingos a las 20hs) ────

export async function sendWeeklyReport() {
  const records = getWeekData();
  const manager = process.env.MANAGER_PHONE;
  if (!manager) return;

  if (!records.length) {
    await send(manager, '📊 *Reporte semanal*\n\nSin mermas en los últimos 7 días.');
    return;
  }

  const stats = statsFrom(records);
  let msg = `📊 *Reporte semanal — últimos 7 días*\n`;
  msg += `Total registros: *${stats.total}*\n`;
  msg += `Promedio diario: *${(stats.total / 7).toFixed(1)}*\n\n`;
  msg += formatCats(stats.cats);
  msg += '\n*Top 5 insumos:*\n';
  for (const [ins, cnt] of stats.topInsumos) msg += `  • ${ins}: ${cnt}\n`;
  msg += '\n*Top personas:*\n';
  for (const [r, cnt] of stats.topResps.slice(0,5)) msg += `  • ${r}: ${cnt}\n`;

  await send(manager, msg.trim());
  console.log(`[cron] Reporte semanal enviado a ${manager}`);
}

// ── Resumen on-demand (cuando el usuario lo pide por WhatsApp) ────

export function buildDailyReportText() {
  const records = getTodayData();
  if (!records.length) return `📊 No hay mermas registradas hoy (${todayStr()}).`;
  const stats = statsFrom(records);
  let msg = `📊 *Reporte del día — ${todayStr()}*\nTotal: *${stats.total}*\n\n`;
  msg += formatCats(stats.cats);
  msg += '\n*Top insumos:*\n';
  for (const [ins, cnt] of stats.topInsumos) msg += `  • ${ins}: ${cnt}\n`;
  return msg.trim();
}

export function buildWeeklyReportText() {
  const records = getWeekData();
  if (!records.length) return '📊 Sin mermas en los últimos 7 días.';
  const stats = statsFrom(records);
  let msg = `📊 *Reporte semanal — últimos 7 días*\nTotal: *${stats.total}* | Prom. diario: *${(stats.total/7).toFixed(1)}*\n\n`;
  msg += formatCats(stats.cats);
  msg += '\n*Top insumos:*\n';
  for (const [ins, cnt] of stats.topInsumos) msg += `  • ${ins}: ${cnt}\n`;
  return msg.trim();
}
