import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const CATS = ['mal-estado','quemado','roto','perso','fecha','prueba','limpieza','otro'];

const CAT_LABELS = {
  'mal-estado': 'Mal estado',
  'quemado':    'Quemado',
  'roto':       'Roto/Quebrado',
  'perso':      'Personal',
  'fecha':      'Vencido',
  'prueba':     'Prueba',
  'limpieza':   'Limpieza',
  'otro':       'Otro',
};

export { CAT_LABELS, CATS };

// ── Detección de intención ────────────────────────────────────────

export async function detectIntent(text) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    system: `Sos un clasificador de mensajes para un sistema de mermas de restaurante.
Categorías disponibles:
- registro: quiere registrar una pérdida/merma
- consulta_hoy: quiere saber las mermas de hoy
- consulta_semana: quiere saber las mermas de la semana
- consulta_persona: quiere saber las mermas de una persona
- resumen: pide un resumen o reporte
- ayuda: pide ayuda o no entiende
- saludo: saluda o agradece
- otro: cualquier otra cosa

Respondé SOLO con el nombre de la categoría, sin explicación.`,
    messages: [{ role: 'user', content: text }],
  });

  return msg.content[0].text.trim().toLowerCase();
}

// ── Extracción de entidades para registro ─────────────────────────

export async function extractRecord(text) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: `Extraé datos de una merma de restaurante desde el mensaje del usuario.
Devolvé SOLO un objeto JSON con estos campos:
- insumo: nombre del ingrediente o producto (string)
- cantidad: cantidad con unidad (string, ej: "2 kg", "1 u", "500 g", "3 porciones")
- cat: categoría de merma — debe ser EXACTAMENTE uno de: ${CATS.join(', ')}
- nota: descripción breve opcional (string o null)

Si no podés identificar un campo, ponelo como null.
No incluyas markdown, solo JSON puro.`,
    messages: [{ role: 'user', content: text }],
  });

  try {
    return JSON.parse(msg.content[0].text.trim());
  } catch {
    return null;
  }
}

// ── Consulta libre al dashboard ───────────────────────────────────

export async function answerQuery(question, context) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `Sos el asistente del sistema de control de mermas de Chuí (restaurante).
Respondé en español, de forma breve y directa, con emojis cuando ayude.
Usá los datos que te proveen como contexto. Formato WhatsApp (sin markdown pesado).`,
    messages: [{
      role: 'user',
      content: `Contexto de datos:\n${context}\n\nPregunta: ${question}`
    }],
  });

  return msg.content[0].text.trim();
}
