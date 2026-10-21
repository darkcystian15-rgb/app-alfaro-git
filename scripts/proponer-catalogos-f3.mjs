import fs from 'node:fs/promises';
import { decryptSnapshot, proposeMappings, privateWrite } from './portal-operations.mjs';

try {
  const [input, output] = process.argv.slice(2);
  if (!input || !output || !process.env.PORTAL_BACKUP_KEY_FILE) throw new Error('Faltan rutas');
  const snapshot = decryptSnapshot(await fs.readFile(input), await fs.readFile(process.env.PORTAL_BACKUP_KEY_FILE));
  const report = proposeMappings(snapshot);
  await privateWrite(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ applied: false, counts: Object.fromEntries(Object.entries(report.fields).map(([field, result]) =>
    [field, Object.fromEntries(Object.entries(result).map(([name, rows]) => [name, rows.length]))])) }));
} catch {
  console.error('Propuesta detenida. Revisar respaldo, clave y rutas de entrada/salida.');
  process.exitCode = 1;
}
