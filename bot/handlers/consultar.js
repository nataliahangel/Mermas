import { getTodayData, getWeekData, getDataByPerson, statsFrom, todayStr } from '../data.js';
import { CAT_LABELS } from '../nlp.js';

// ── Mermas de hoy ─────────────────────────────────────────────────

export function consultaHoy() {
  const records = getTodayData();
  if (!records.length) return `📊 No hay mermas registradas hoy (${todayStr()}).`;

  const stats = statsFrom(records);
  return buildResumenMsg(`📊 *Mermas de hoy — ${todayStr()}*`, records, stats);
}

// ── Mermas de la semana ───────────────────────────────────────────

export function consultaSemana() {
  const records = getWeekData();
  if (!records.length) return '📊 No hay mermas registradas en los últimos 7 días.';

  const stats = statsFrom(records);
  return buildResumenMsg('📊 *Mermas — Últimos 7 días*', records, stats);
}

// ── Mermas por persona ────────────────────────────────────────────

export function consultaPersona(nombre) {
  if (!nombre) return '¿De quién querés ver las mermas? Ejemplo: _mermas de Shalmi_';
  const records = getDataByPerson(nombre);
  if (!records.length) return `No encontré mermas para *${nombre}*. Verificá el nombre.`;

  const stats = statsFrom(records);
  let msg = `👤 *Mermas de ${nombre}*\n`;
  msg += `Total: *${stats.total}* registros\n\n`;
  msg += formatCats(stats.cats);
  msg += '\n*Top insumos:*\n';
  for (const [ins, cnt] of stats.topInsumos) msg += `  • ${ins}: ${cnt}\n`;
  return msg.trim();
}

// ── Helpers ───────────────────────────────────────────────────────

function buildResumenMsg(titulo, records, stats) {
  let msg = `${titulo}\n`;
  msg += `Total: *${stats.total}* registros\n\n`;
  msg += formatCats(stats.cats);

  if (stats.topInsumos.length) {
    msg += '\n*Top insumos:*\n';
    for (const [ins, cnt] of stats.topInsumos) msg += `  • ${ins}: ${cnt}\n`;
  }
  if (stats.topResps.length) {
    msg += '\n*Por persona:*\n';
    for (const [r, cnt] of stats.topResps) msg += `  • ${r}: ${cnt}\n`;
  }
  return msg.trim();
}

export function formatCats(cats) {
  if (!Object.keys(cats).length) return '';
  const order = ['mal-estado','quemado','roto','fecha','perso','prueba','limpieza','otro'];
  const icons  = { 'mal-estado':'🥬','quemado':'🔥','roto':'💔','fecha':'📅','perso':'👤','prueba':'🧪','limpieza':'🧹','otro':'📦' };

  let s = '*Por motivo:*\n';
  for (const cat of order) {
    if (cats[cat]) s += `  ${icons[cat]||'•'} ${CAT_LABELS[cat]}: ${cats[cat]}\n`;
  }
  return s;
}
