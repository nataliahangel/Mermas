import { detectIntent } from './nlp.js';
import { getSession, setSession, clearSession } from './sessions.js';
import { getUserName } from './data.js';
import { handleRegistro, handleConfirmation, handleNombre, formatHelp } from './handlers/registrar.js';
import { consultaHoy, consultaSemana, consultaPersona } from './handlers/consultar.js';
import { buildDailyReportText, buildWeeklyReportText } from './handlers/resumen.js';

// Extrae nombre de una consulta tipo "mermas de Shalmi"
function extractPersonName(text) {
  const m = text.match(/(?:mermas|de)\s+([a-záéíóúüñ][a-záéíóúüñ\s]+)$/i);
  return m ? m[1].trim() : null;
}

export async function handleMessage(phone, text) {
  const session = getSession(phone);
  const t = text.trim();

  // ── Flujos activos de conversación ───────────────────────────────

  if (session.step === 'confirm_registro') {
    return await handleConfirmation(phone, t);
  }

  if (session.step === 'pedir_nombre') {
    return await handleNombre(phone, t);
  }

  // ── Comandos directos (sin IA) ────────────────────────────────────

  const tl = t.toLowerCase();

  if (['hola','buenas','buenos días','buen día','buenas tardes','buenas noches'].some(s => tl.includes(s))) {
    const nombre = getUserName(phone);
    const saludo = nombre ? `¡Hola, ${nombre}!` : '¡Hola!';
    return `${saludo} 👋\n\n${formatHelp()}`;
  }

  if (tl === 'ayuda' || tl === '/ayuda' || tl === 'help') return formatHelp();

  if (tl.includes('reporte diario') || tl.includes('resumen diario')) return buildDailyReportText();
  if (tl.includes('reporte semanal') || tl.includes('resumen semanal') || tl.includes('resumen de la semana')) return buildWeeklyReportText();
  if (tl.includes('hoy')) return consultaHoy();
  if (tl.includes('semana') || tl.includes('7 días') || tl.includes('últimos días')) return consultaSemana();

  // "mermas de [nombre]"
  if (tl.startsWith('mermas de ')) {
    const nombre = tl.replace('mermas de ','').trim();
    if (nombre) return consultaPersona(nombre);
  }

  // ── Clasificación con Claude (para mensajes ambiguos) ─────────────

  let intent;
  try {
    intent = await detectIntent(t);
  } catch (err) {
    console.error('[nlp] detectIntent error:', err.message);
    intent = 'otro';
  }

  switch (intent) {
    case 'registro':
      return await handleRegistro(phone, t);

    case 'consulta_hoy':
      return consultaHoy();

    case 'consulta_semana':
      return consultaSemana();

    case 'consulta_persona':
      return consultaPersona(extractPersonName(t));

    case 'resumen':
      return buildDailyReportText();

    case 'saludo':
      return `${getUserName(phone) ? `¡Hola, ${getUserName(phone)}!` : '¡Hola!'} 👋\n\n${formatHelp()}`;

    case 'ayuda':
    default:
      return formatHelp();
  }
}
