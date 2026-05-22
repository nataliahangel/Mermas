import { extractRecord, CAT_LABELS } from '../nlp.js';
import { addRecord, getUserName, setUserName, todayStr } from '../data.js';
import { getSession, setSession, clearSession } from '../sessions.js';

const CONFIRM_WORDS = new Set(['si','sí','s','yes','y','ok','dale','confirmar','confirmo']);
const CANCEL_WORDS  = new Set(['no','n','cancelar','cancel','nope']);

// ── Flujo de confirmación pendiente ──────────────────────────────

export async function handleConfirmation(phone, text) {
  const t = text.trim().toLowerCase();
  const session = getSession(phone);

  if (CONFIRM_WORDS.has(t)) {
    const saved = addRecord(session.pendingRecord);
    clearSession(phone);
    return `✅ *Merma registrada* (id: ${saved.id})\n\n${formatRecord(saved)}`;
  }

  if (CANCEL_WORDS.has(t)) {
    clearSession(phone);
    return '❌ Registro cancelado. Mandame uno nuevo cuando quieras.';
  }

  return `No entendí. Respondé *sí* para confirmar o *no* para cancelar.\n\n${formatPending(session.pendingRecord)}`;
}

// ── Inicio de registro ────────────────────────────────────────────

export async function handleRegistro(phone, text) {
  const nombre = getUserName(phone);
  if (!nombre) {
    setSession(phone, { step: 'pedir_nombre', pendingText: text });
    return `¡Hola! Soy el bot de mermas de Chuí 🍽️\n\n¿Cuál es tu nombre? (tal como aparece en el sistema)`;
  }

  const parsed = await extractRecord(text);
  if (!parsed || !parsed.insumo) {
    return formatHelp();
  }

  const record = {
    fecha:    todayStr(),
    insumo:   capitalizeFirst(parsed.insumo),
    cantidad: parsed.cantidad || 'cantidad no especificada',
    cat:      VALID_CAT(parsed.cat),
    nota:     parsed.nota || '—',
    resp:     nombre,
  };

  setSession(phone, { step: 'confirm_registro', pendingRecord: record });
  return `📋 ¿Confirmás este registro?\n\n${formatPending(record)}\n\nRespondé *sí* o *no*`;
}

// ── Registro de nombre (primer uso) ──────────────────────────────

export async function handleNombre(phone, name) {
  const nombre = name.trim();
  if (nombre.length < 2 || nombre.length > 40) {
    return 'El nombre debe tener entre 2 y 40 caracteres. ¿Cuál es tu nombre?';
  }
  setUserName(phone, nombre);
  const session = getSession(phone);
  const pendingText = session.pendingText;
  clearSession(phone);

  if (pendingText) {
    return await handleRegistro(phone, pendingText);
  }
  return `Perfecto, *${nombre}*! Ya quedaste registrado/a.\n\n${formatHelp()}`;
}

// ── Helpers ───────────────────────────────────────────────────────

function formatRecord(r) {
  return `📅 ${r.fecha}  |  👤 ${r.resp}\n🥗 ${r.insumo} — ${r.cantidad}\n🏷️ ${CAT_LABELS[r.cat] || r.cat}\n📝 ${r.nota}`;
}

function formatPending(r) {
  return `🥗 *${r.insumo}* — ${r.cantidad}\n🏷️ *Motivo:* ${CAT_LABELS[r.cat] || r.cat}\n📝 *Nota:* ${r.nota}\n👤 *Responsable:* ${r.resp}\n📅 *Fecha:* ${r.fecha}`;
}

function VALID_CAT(cat) {
  const valid = ['mal-estado','quemado','roto','perso','fecha','prueba','limpieza','otro'];
  return valid.includes(cat) ? cat : 'otro';
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;
}

export function formatHelp() {
  return `🤖 *Bot de Mermas — Chuí*

*Registrar una merma:*
Simplemente escribí lo que perdiste, por ejemplo:
• _2 kg zanahoria mal estado_
• _quemé 3 porciones de focaccia_
• _500g queso vencido_

*Consultar datos:*
• _mermas de hoy_
• _resumen de la semana_
• _mermas de Shalmi_

*Reporte:*
• _reporte diario_
• _reporte semanal_`;
}
