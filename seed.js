/**
 * seed.js — carga datos de ejemplo (mockData) en el proyecto Supabase.
 *
 * Uso:
 *   npm run seed              # escribe los datos
 *   npm run seed -- --dry-run # solo verifica conexión y cuenta filas, no escribe
 *
 * Credenciales: NUNCA en el código. Se leen de .env en la raíz del repo
 * (VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY, las mismas que usa la app).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { MOCK_USERS, MOCK_LABELS, MOCK_COLUMNS, MOCK_CARDS, MOCK_COMMENTS, MOCK_NOTIFICATIONS } from './src/data/mockData.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');

/** Lee .env sin dependencias externas; no pisa variables ya exportadas. */
function cargarEnv(archivo = path.join(raiz, '.env')) {
  if (!fs.existsSync(archivo)) return;
  for (const linea of fs.readFileSync(archivo, 'utf8').split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const i = limpia.indexOf('=');
    if (i === -1) continue;
    const clave = limpia.slice(0, i).trim();
    const valor = limpia.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(clave in process.env)) process.env[clave] = valor;
  }
}

cargarEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Faltan credenciales. Crea un .env en la raíz del repo a partir de .env.example:\n' +
    '  cp .env.example .env\n' +
    'y rellena VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
  process.exit(1);
}

if (supabaseKey.startsWith('sb_secret') || supabaseKey.includes('service_role')) {
  console.error('Esa es la llave secreta. seed.js solo necesita la publishable; no la metas aquí.');
  process.exit(1);
}

console.log(`Proyecto: ${supabaseUrl}${dryRun ? '  (dry-run: no se escribe nada)' : ''}`);
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLAS = {
  users: MOCK_USERS,
  labels: MOCK_LABELS,
  columns: MOCK_COLUMNS,
  cards: MOCK_CARDS,
  comments: MOCK_COMMENTS,
  notifications: MOCK_NOTIFICATIONS,
};

async function escribir(tabla, filas) {
  const { error } = await supabase.from(tabla).upsert(filas);
  if (error) {
    console.error(`  ✗ ${tabla}: ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${tabla} (${filas.length})`);
  return true;
}

async function contar(tabla) {
  const { count, error } = await supabase.from(tabla).select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`  ✗ ${tabla}: ${error.message}`);
    return false;
  }
  console.log(`  ${tabla}: ${count ?? 0} filas`);
  return true;
}

async function seed() {
  if (dryRun) {
    console.log('Verificando acceso de lectura...');
    let ok = true;
    for (const tabla of Object.keys(TABLAS)) {
      ok = (await contar(tabla)) && ok;
    }
    console.log(ok ? 'Conexión y credenciales OK.' : 'Hay tablas inaccesibles: revisa RLS o el esquema.');
    if (!ok) process.exitCode = 1;
    return;
  }

  console.log('Sembrando datos...');
  await escribir('users', MOCK_USERS);
  await escribir('labels', MOCK_LABELS);
  await escribir('columns', MOCK_COLUMNS);

  // Las tarjetas no llevan los arreglos: viven en card_assignees / card_labels.
  const cleanCards = MOCK_CARDS.map(c => {
    const { assignees, labels, ...rest } = c;
    if (rest.dueDate === null) delete rest.dueDate;
    return rest;
  });
  await escribir('cards', cleanCards);

  const cardAssignees = [];
  const cardLabels = [];
  MOCK_CARDS.forEach(c => {
    if (c.assignees) c.assignees.forEach(u => cardAssignees.push({ cardId: c.id, userId: u }));
    if (c.labels) c.labels.forEach(l => cardLabels.push({ cardId: c.id, labelId: l }));
  });
  await escribir('card_assignees', cardAssignees);
  await escribir('card_labels', cardLabels);
  await escribir('comments', MOCK_COMMENTS);
  await escribir('notifications', MOCK_NOTIFICATIONS);

  console.log('Listo.');
}

seed().catch(err => {
  console.error('Falló el seed:', err.message ?? err);
  process.exit(1);
});
