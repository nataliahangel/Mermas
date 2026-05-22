// Estado de conversación en memoria (por número de WhatsApp)
const sessions = new Map();

const DEFAULT = () => ({ step: null, pendingRecord: null });

export function getSession(phone) {
  if (!sessions.has(phone)) sessions.set(phone, DEFAULT());
  return sessions.get(phone);
}

export function setSession(phone, data) {
  sessions.set(phone, { ...getSession(phone), ...data });
}

export function clearSession(phone) {
  sessions.set(phone, DEFAULT());
}
