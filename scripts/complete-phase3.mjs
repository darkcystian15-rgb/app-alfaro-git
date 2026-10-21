import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { loadConfig, privateWrite } from './portal-operations.mjs';
import { installWorkflow, reconcile } from './reconcile-phase3.mjs';
let db;
try {
  const apply = process.argv.includes('--apply');
  const output = process.argv.find((arg,index) => index > 1 && arg !== '--apply');
  if (!output) throw new Error('Se requiere ruta privada del informe');
  // Comprobar la ruta antes de modificar la base; nunca sobrescribir evidencias.
  try { await fs.access(output); throw new Error('Informe ya existe'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  db = await mysql.createConnection(await loadConfig());
  if (apply) await installWorkflow(db);
  const report = await reconcile(db, apply);
  report.checkedAt = new Date().toISOString();
  await privateWrite(output, JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} catch (error) { console.error(error.code || error.message); process.exitCode=1; }
finally { await db?.end(); }
