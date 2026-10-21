import mysql from 'mysql2/promise';
import { loadConfig, privateWrite, audit } from './portal-operations.mjs';

let db;
try {
  const output = process.argv[2];
  if (!output) throw new Error('Indicar ruta del informe privado de salida');
  db = await mysql.createConnection(await loadConfig());
  const report = await audit(db);
  await privateWrite(output, JSON.stringify(report, null, 2) + '\n');
  console.log('Auditoría terminada sin escrituras. Informe privado guardado.');
} catch {
  console.error('Auditoría detenida. Revisar configuración, permisos, esquema y ruta de salida.');
  process.exitCode = 1;
} finally { await db?.end(); }
