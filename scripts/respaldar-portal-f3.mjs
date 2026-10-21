// Copia lógica cifrada de tablas y vistas. No descarga archivos multimedia.
// Se rechazan objetos no soportados para no presentar una copia incompleta como integral.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';
import { loadConfig, privateWrite, encryptSnapshot, decryptSnapshot, PORTAL_DATABASE } from './portal-operations.mjs';

let db;
try {
  const output = process.argv[2];
  if (!output || !process.env.PORTAL_BACKUP_KEY_FILE) throw new Error('Faltan salida o clave privada');
  const key = await fs.readFile(process.env.PORTAL_BACKUP_KEY_FILE);
  assert.equal(key.length, 32);
  db = await mysql.createConnection(await loadConfig());
  for (const [object, column] of [['TRIGGERS','TRIGGER_SCHEMA'], ['ROUTINES','ROUTINE_SCHEMA'], ['EVENTS','EVENT_SCHEMA']]) {
    const [[row]] = await db.query(`SELECT COUNT(*) AS total FROM information_schema.${object} WHERE ${column}=?`, [PORTAL_DATABASE]);
    assert.equal(Number(row.total), 0, `Objetos ${object} requieren herramienta de respaldo integral`);
  }
  const [engines] = await db.query("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'", [PORTAL_DATABASE]);
  assert.ok(engines.every(row => row.ENGINE === 'InnoDB'), 'Se requieren tablas transaccionales InnoDB');
  const snapshot = { version: 1, database: PORTAL_DATABASE, createdAt: new Date().toISOString(), tables: {}, views: {} };
  await db.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  try {
    const [objects] = await db.query('SHOW FULL TABLES');
    for (const object of objects) {
      const [name, type] = Object.values(object);
      const [[ddl]] = await db.query(`SHOW CREATE ${type === 'VIEW' ? 'VIEW' : 'TABLE'} ${mysql.escapeId(name)}`);
      if (type === 'VIEW') snapshot.views[name] = ddl['Create View'];
      else {
        const [rows, fields] = await db.query(`SELECT * FROM ${mysql.escapeId(name)}`);
        snapshot.tables[name] = { ddl: ddl['Create Table'], columns: fields.map(field => field.name), rows };
      }
    }
    // No cambios DDL durante esta ventana: comprobar que no varió el inventario.
    const [after] = await db.query('SHOW FULL TABLES');
    assert.deepEqual(after, objects);
  } finally { await db.rollback(); }
  const bytes = encryptSnapshot(snapshot, key);
  assert.deepEqual(decryptSnapshot(bytes, key), JSON.parse(JSON.stringify(snapshot)));
  await privateWrite(output, bytes);
  const readBack = await fs.readFile(output);
  assert.deepEqual(decryptSnapshot(readBack, key), JSON.parse(JSON.stringify(snapshot)));
  console.log(JSON.stringify({ encrypted: true, readBackVerified: true,
    sha256: createHash('sha256').update(readBack).digest('hex'),
    tables: Object.keys(snapshot.tables).length, views: Object.keys(snapshot.views).length,
    mediaBackedUp: false, restorationTested: false }));
} catch {
  console.error('Respaldo detenido. Revisar configuración, clave, permisos, objetos soportados y ruta de salida.');
  process.exitCode = 1;
} finally { await db?.end(); }
