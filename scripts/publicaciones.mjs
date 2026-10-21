// Herramienta privada: la autenticación es la conexión MySQL configurada fuera de Git.
import mysql from 'mysql2/promise';
import { loadConfig } from './portal-operations.mjs';
import { changePublication } from './publication-workflow.mjs';

let db;
try {
  const [command, id, expected, status] = process.argv.slice(2);
  db = await mysql.createConnection(await loadConfig());
  if (command === 'list') {
    const [rows] = await db.query('SELECT property_id,publication_status,approved_at FROM publications ORDER BY property_id');
    console.log(JSON.stringify(rows, null, 2));
  } else if (command === 'change') {
    if (!process.argv.includes('--apply')) throw new Error('Cambio requiere --apply');
    const result = await changePublication(db, { id: Number(id), expected, status,
      actor: process.env.PORTAL_OPERATOR, reason: process.env.PORTAL_CHANGE_REASON,
      confirmPublicData: process.argv.includes('--confirm-public-data') });
    console.log(JSON.stringify(result));
  } else throw new Error('Uso: list | change ID ESTADO_ACTUAL ESTADO_NUEVO --apply [--confirm-public-data]');
} catch (error) {
  console.error(error.sql || error.fatal ? 'Operación fallida. Revisar configuración y permisos privados.' : error.message);
  process.exitCode = 1;
} finally { await db?.end(); }
