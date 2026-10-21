import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile, mkdtemp, stat, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { audit, checks, encryptSnapshot, decryptSnapshot, privateWrite, loadConfig, proposeMappings } from '../scripts/portal-operations.mjs';

test('catalog proposals distinguish unique labels, ambiguity and absent labels without changing data', () => {
  const snapshot = { database: 'inmobi16_portal', tables: {
    properties: { rows: [
      { id: 1, title: ' CASA ', status: 'venta', location: 'Lima' },
      { id: 2, title: 'desconocido', status: 'alquiler', location: '', district_id: 99 },
    ] },
    tipos: { rows: [{ id: 10, nombre: 'Casa' }] },
    modalidades: { rows: [{ id: 20, nombre: 'Venta' }, { id: 21, nombre: 'venta' }] },
    distritos: { rows: [{ id: 30, nombre: 'Lima' }] },
  } };
  const original = structuredClone(snapshot);
  const report = proposeMappings(snapshot);
  assert.equal(report.applied, false);
  assert.deepEqual(report.fields.property_type_id.uniqueCandidates, [{ propertyId: 1, candidateId: 10 }]);
  assert.deepEqual(report.fields.property_type_id.unmatched, [2]);
  assert.deepEqual(report.fields.modality_id.ambiguous, [{ propertyId: 1, candidateIds: [20, 21] }]);
  assert.deepEqual(report.fields.district_id.alreadyAssigned, [2]);
  assert.deepEqual(snapshot, original);
  assert.throws(() => proposeMappings({ ...snapshot, database: 'another_database' }));
});

test('private outputs are owner-only and cannot overwrite previous backups', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portal-operation-test-'));
  try {
    const file = path.join(dir, 'backup');
    await privateWrite(file, 'original');
    assert.equal((await stat(file)).mode & 0o777, 0o600);
    await assert.rejects(privateWrite(file, 'replacement'), { code: 'EEXIST' });
    assert.equal(await readFile(file, 'utf8'), 'original');
    const config = path.join(dir, 'config.json');
    await privateWrite(config, JSON.stringify({ DB_NAME: 'original_database' }));
    const previous = process.env.PORTAL_DB_CONFIG;
    process.env.PORTAL_DB_CONFIG = config;
    try { await assert.rejects(loadConfig(), /base independiente/); }
    finally {
      if (previous === undefined) delete process.env.PORTAL_DB_CONFIG;
      else process.env.PORTAL_DB_CONFIG = previous;
    }
  } finally { await rm(dir, { recursive: true }); }
});

test('encrypted backup round trip; wrong key and tampered data are rejected', () => {
  const key = randomBytes(32);
  const snapshot = { tables: { properties: { rows: [{ id: 42, description: 'Área reservada' }] } } };
  const bytes = encryptSnapshot(snapshot, key);
  assert.ok(!bytes.includes(Buffer.from('Área reservada')));
  assert.deepEqual(decryptSnapshot(bytes, key), snapshot);
  assert.throws(() => decryptSnapshot(bytes, randomBytes(32)));
  const damaged = Buffer.from(bytes);
  damaged[damaged.length - 1] ^= 1;
  assert.throws(() => decryptSnapshot(damaged, key));
  assert.throws(() => decryptSnapshot(Buffer.from('invalid'), key));
  assert.throws(() => encryptSnapshot(snapshot, Buffer.alloc(0)));
});

test('audit only reads in a consistent read-only transaction and rolls back', async () => {
  const queries = [];
  let rollbacks = 0;
  const report = await audit({
    async query(sql) { queries.push(sql); return [[{ id: 12 }]]; },
    async rollback() { rollbacks++; },
  });
  assert.ok(queries.includes('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'));
  assert.ok(queries.every(sql => /^(SET SESSION|START TRANSACTION|SELECT )/.test(sql)));
  assert.equal(rollbacks, 1);
  for (const name of Object.keys(checks)) assert.deepEqual(report.checks[name], { count: 1, ids: [12] });
  assert.ok(!JSON.stringify(report).includes('description'));
});

test('audit rolls back even if a query fails', async () => {
  let rolledBack = false;
  await assert.rejects(audit({
    async query(sql) { if (sql.startsWith('SELECT')) throw new Error('unavailable'); },
    async rollback() { rolledBack = true; },
  }));
  assert.ok(rolledBack);
});

test('retired diagnostics never expose environment values or connect to services', async () => {
  for (const name of ['test-env', 'get-options_test_db']) {
    const source = await readFile(new URL(`../netlify/functions/${name}.js`, import.meta.url), 'utf8');
    const { handler } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const response = await handler();
    assert.equal(response.statusCode, 410);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.deepEqual(JSON.parse(response.body), { error: 'Diagnóstico retirado' });
  }
});

test('editorial API errors preserve contracts without disclosing SQL or credentials', async () => {
  for (const name of ['get-options', 'get-social-links', 'getArticulos', 'getAsesores', 'getNoticias']) {
    let source = await readFile(new URL(`../api/${name}.js`, import.meta.url), 'utf8');
    source = source.replace(/import \{ pool \} from "\.\/db\.js";[^\n]*/, 'const pool = globalThis.__phase3FailurePool;');
    globalThis.__phase3FailurePool = { async execute() { throw new Error('SELECT password FROM private_database'); }, async query() { throw new Error('SELECT password FROM private_database'); } };
    const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const response = { status(n) { this.statusCode = n; return this; }, setHeader() { return this; }, json(body) { this.body = body; return this; } };
    const oldError = console.error;
    console.error = () => {};
    try { await handler({ method: 'GET', query: {} }, response); }
    finally { console.error = oldError; delete globalThis.__phase3FailurePool; }
    assert.equal(response.statusCode, 500, name);
    assert.ok(!JSON.stringify(response.body).includes('private_database'), name);
    assert.ok(!JSON.stringify(response.body).includes('password'), name);
  }
});
