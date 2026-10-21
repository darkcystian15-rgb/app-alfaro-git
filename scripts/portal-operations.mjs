import fs from 'node:fs/promises';
import path from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';

export const PORTAL_DATABASE = 'inmobi16_portal';

export async function loadConfig() {
  if (!process.env.PORTAL_DB_CONFIG) throw new Error('Falta PORTAL_DB_CONFIG: ruta privada JSON');
  const config = JSON.parse(await fs.readFile(process.env.PORTAL_DB_CONFIG, 'utf8'));
  if (config.DB_NAME !== PORTAL_DATABASE) throw new Error('Se requiere explícitamente la base independiente del portal');
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD']) {
    if (typeof config[key] !== 'string' || !config[key]) throw new Error(`Falta ${key}`);
  }
  return { host: config.DB_HOST, port: Number(config.DB_PORT || 3306),
    user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME,
    connectTimeout: 15000, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true };
}

export async function privateWrite(filename, contents) {
  const handle = await fs.open(path.resolve(filename), 'wx', 0o600);
  try { await handle.writeFile(contents); } finally { await handle.close(); }
}

const magic = Buffer.from('ALFARO-F3-BACKUP-1\n');
export function encryptSnapshot(snapshot, key) {
  if (key.length !== 32) throw new Error('La clave debe tener exactamente 32 bytes');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(magic);
  const encrypted = Buffer.concat([cipher.update(gzipSync(JSON.stringify(snapshot))), cipher.final()]);
  return Buffer.concat([magic, iv, cipher.getAuthTag(), encrypted]);
}

export function decryptSnapshot(bytes, key) {
  if (key.length !== 32 || bytes.length < magic.length + 28 || !bytes.subarray(0, magic.length).equals(magic)) {
    throw new Error('Formato o clave de respaldo inválido');
  }
  const offset = magic.length;
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(offset, offset + 12));
  decipher.setAAD(magic);
  decipher.setAuthTag(bytes.subarray(offset + 12, offset + 28));
  const compressed = Buffer.concat([decipher.update(bytes.subarray(offset + 28)), decipher.final()]);
  return JSON.parse(gunzipSync(compressed).toString('utf8'));
}

export const checks = {
  orphanGallery: 'SELECT s.id FROM sub_properties s LEFT JOIN properties p ON p.id=s.property_id WHERE p.id IS NULL ORDER BY s.id',
  orphanInfo: 'SELECT m.id FROM mas_info m LEFT JOIN properties p ON p.id=m.id_properties WHERE p.id IS NULL ORDER BY m.id',
  zeroOrMissingArea: 'SELECT id FROM properties WHERE area IS NULL OR area=0 ORDER BY id',
  emptyAddress: "SELECT id FROM properties WHERE address IS NULL OR TRIM(address)='' ORDER BY id",
  missingType: 'SELECT id FROM properties WHERE property_type_id IS NULL ORDER BY id',
  missingModality: 'SELECT id FROM properties WHERE modality_id IS NULL ORDER BY id',
  missingDistrict: 'SELECT id FROM properties WHERE district_id IS NULL ORDER BY id',
  unknownCurrency: 'SELECT id FROM properties WHERE currency_code IS NULL ORDER BY id',
  missingPublication: 'SELECT p.id FROM properties p LEFT JOIN publications pub ON pub.property_id=p.id WHERE pub.property_id IS NULL ORDER BY p.id',
  invalidApproval: "SELECT property_id AS id FROM publications WHERE publication_status='published' AND approved_at IS NULL ORDER BY property_id",
  invalidGalleryReference: 'SELECT id FROM sub_properties WHERE property_ref_id IS NOT NULL AND property_ref_id<>property_id ORDER BY id',
  invalidInfoReference: 'SELECT id FROM mas_info WHERE property_ref_id IS NOT NULL AND property_ref_id<>id_properties ORDER BY id',
};

export async function audit(db) {
  const report = { database: PORTAL_DATABASE, checkedAt: new Date().toISOString(), readOnly: true, checks: {} };
  await db.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  try {
    for (const [name, sql] of Object.entries(checks)) {
      const [rows] = await db.query(sql);
      report.checks[name] = { count: rows.length, ids: rows.map(row => row.id) };
    }
    const [publications] = await db.query('SELECT publication_status,COUNT(*) AS total FROM publications GROUP BY publication_status');
    report.publications = publications;
    return report;
  } finally { await db.rollback(); }
}

// Propuestas para revisión humana; una igualdad de etiquetas no confirma identidad comercial.
export function proposeMappings(snapshot) {
  if (snapshot.database !== PORTAL_DATABASE) throw new Error('Respaldo de otra base');
  const report = { createdAt: new Date().toISOString(), applied: false, fields: {} };
  const normalize = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
  for (const [reference, label, catalog] of [
    ['property_type_id', 'title', 'tipos'],
    ['modality_id', 'status', 'modalidades'],
    ['district_id', 'location', 'distritos'],
  ]) {
    const result = { uniqueCandidates: [], ambiguous: [], unmatched: [], alreadyAssigned: [] };
    for (const property of snapshot.tables.properties.rows) {
      if (property[reference] != null) { result.alreadyAssigned.push(property.id); continue; }
      const value = normalize(property[label]);
      const ids = snapshot.tables[catalog].rows.filter(row => value && normalize(row.nombre) === value).map(row => row.id);
      if (ids.length === 1) result.uniqueCandidates.push({ propertyId: property.id, candidateId: ids[0] });
      else if (ids.length > 1) result.ambiguous.push({ propertyId: property.id, candidateIds: ids });
      else result.unmatched.push(property.id);
    }
    report.fields[reference] = result;
  }
  return report;
}
