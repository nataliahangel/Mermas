import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_FILE  = join(root, 'data/mermas_base.json');
const NEW_FILE   = join(root, 'data/mermas_new.json');
const USERS_FILE = join(root, 'data/usuarios.json');

function load(file, fallback) {
  try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback; }
  catch { return fallback; }
}

let baseData  = load(BASE_FILE, []);
let newData   = load(NEW_FILE, []);
let usuarios  = load(USERS_FILE, {});

// ── Helpers de fecha ──────────────────────────────────────────────

export function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function lastNDays(n) {
  const days = new Set();
  for (let i = 0; i < n; i++) days.add(daysAgo(i));
  return days;
}

// ── Acceso a datos ────────────────────────────────────────────────

export function getAllData()   { return [...baseData, ...newData]; }
export function getTodayData() { const h = todayStr(); return getAllData().filter(r => r.fecha === h); }
export function getWeekData()  { const w = lastNDays(7);  return getAllData().filter(r => w.has(r.fecha)); }

export function getDataByPerson(nombre) {
  const n = nombre.toLowerCase();
  return getAllData().filter(r => r.resp?.toLowerCase() === n);
}

export function getDataByDate(fecha) {
  return getAllData().filter(r => r.fecha === fecha);
}

export function addRecord(record) {
  const saved = { id: Date.now(), ...record, registradoEn: new Date().toISOString() };
  newData.push(saved);
  writeFileSync(NEW_FILE, JSON.stringify(newData, null, 2));
  return saved;
}

export function getNewData() { return newData; }

// ── Estadísticas ──────────────────────────────────────────────────

export function statsFrom(records) {
  const total   = records.length;
  const cats    = {};
  const insumos = {};
  const resps   = {};

  for (const r of records) {
    cats[r.cat]     = (cats[r.cat]     || 0) + 1;
    insumos[r.insumo] = (insumos[r.insumo] || 0) + 1;
    resps[r.resp]   = (resps[r.resp]   || 0) + 1;
  }

  const topInsumos = Object.entries(insumos).sort((a,b) => b[1]-a[1]).slice(0,5);
  const topResps   = Object.entries(resps).sort((a,b) => b[1]-a[1]).slice(0,5);

  return { total, cats, topInsumos, topResps };
}

// ── Usuarios ──────────────────────────────────────────────────────

export function getUserName(phone) { return usuarios[phone] || null; }

export function setUserName(phone, name) {
  usuarios[phone] = name;
  writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2));
}
