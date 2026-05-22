#!/usr/bin/env node
// Extrae el array DATA de index.html y lo guarda en data/mermas_base.json
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const match = html.match(/const DATA=(\[[\s\S]*?\n\];)/);
if (!match) throw new Error('No se encontró const DATA= en index.html');

const DATA = new Function(`return ${match[1]}`)();

const out = join(root, 'data/mermas_base.json');
writeFileSync(out, JSON.stringify(DATA, null, 2));
console.log(`✅ ${DATA.length} registros extraídos → data/mermas_base.json`);
