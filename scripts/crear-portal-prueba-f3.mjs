// Ejecutar desde la raíz. La configuración privada se recibe por ruta, nunca por Git.
import fs from 'node:fs';
import crypto from 'node:crypto';
import mysql from '../node_modules/mysql2/promise.js';

const configPath = process.argv[2];
if (!configPath) throw new Error('Indicar ruta del JSON privado de conexión');
const v = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const target = 'inmobi16_portal';
if (v.DB_NAME === target) throw new Error('Origen y destino deben ser distintos');
const options = { host: v.DB_HOST, port: Number(v.DB_PORT || 3306), user: v.DB_USER,
  password: v.DB_PASSWORD, connectTimeout: 15000, dateStrings: true,
  supportBigNumbers: true, bigNumberStrings: true };
const source = await mysql.createConnection({ ...options, database: v.DB_NAME });
const dest = await mysql.createConnection({ ...options, database: target });
const qi = mysql.escapeId;
const tables = ['properties', 'sub_properties', 'mas_info', 'distritos', 'modalidades',
  'tipos', 'asesores', 'articulos', 'noticias', 'redes_sociales'];
const hash = rows => crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
const snapshot = {};
const report = { target, startedAt: new Date().toISOString(), tables: {}, checks: {} };
try {
  const [existing] = await dest.query('SHOW TABLES');
  if (existing.length) throw new Error('Destino no vacío: detener para evitar sobrescrituras');
  // Solo DDL sobre la nueva base; la conexión origen ejecuta exclusivamente lecturas.
  for (const table of tables) {
    await dest.query(`CREATE TABLE ${qi(table)} LIKE ${qi(v.DB_NAME)}.${qi(table)}`);
  }
  await dest.query(`CREATE TABLE currencies (
    code CHAR(3) PRIMARY KEY, name VARCHAR(80) NOT NULL
  ) ENGINE=InnoDB`);
  await dest.query(`ALTER TABLE properties
    ADD currency_code CHAR(3) NULL,
    ADD price_basis VARCHAR(40) NULL,
    ADD property_type_id INT NULL,
    ADD modality_id INT NULL,
    ADD district_id INT NULL,
    ADD CONSTRAINT fk_properties_currency FOREIGN KEY (currency_code) REFERENCES currencies(code),
    ADD CONSTRAINT fk_properties_type FOREIGN KEY (property_type_id) REFERENCES tipos(id),
    ADD CONSTRAINT fk_properties_modality FOREIGN KEY (modality_id) REFERENCES modalidades(id),
    ADD CONSTRAINT fk_properties_district FOREIGN KEY (district_id) REFERENCES distritos(id),
    ADD INDEX idx_properties_created (created_at, id),
    ADD INDEX idx_properties_featured_created (destacado, created_at, id)`);
  for (const table of ['sub_properties', 'mas_info']) {
    await dest.query(`ALTER TABLE ${qi(table)} ADD property_ref_id INT UNSIGNED NULL,
      ADD CONSTRAINT ${qi('fk_' + table + '_property')} FOREIGN KEY (property_ref_id)
      REFERENCES properties(id) ON DELETE RESTRICT ON UPDATE RESTRICT`);
  }
  await dest.query('ALTER TABLE sub_properties ADD INDEX idx_gallery_order (property_id, `order`, id)');
  await dest.query('ALTER TABLE mas_info ADD INDEX idx_info_property (id_properties, id)');
  await dest.query(`CREATE TABLE publications (
    property_id INT UNSIGNED PRIMARY KEY,
    publication_status ENUM('pending_review','published','suspended','withdrawn') NOT NULL DEFAULT 'pending_review',
    approved_at DATETIME NULL,
    source_system VARCHAR(40) NOT NULL DEFAULT 'legacy_portal',
    internal_reference VARCHAR(191) NULL,
    CONSTRAINT fk_publication_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE RESTRICT,
    INDEX idx_publication_status (publication_status, property_id)
  ) ENGINE=InnoDB`);
  await dest.query(`CREATE TABLE migration_issues (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    source_table VARCHAR(64) NOT NULL, source_id BIGINT NOT NULL,
    issue_code VARCHAR(64) NOT NULL, details JSON NULL,
    resolved_at DATETIME NULL,
    UNIQUE KEY unique_issue (source_table, source_id, issue_code)
  ) ENGINE=InnoDB`);
  await dest.query(`CREATE TABLE migration_runs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    completed_at DATETIME NOT NULL, summary JSON NOT NULL
  ) ENGINE=InnoDB`);
  await source.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  for (const table of tables) {
    const [rows, fields] = await source.query(`SELECT * FROM ${qi(table)} ORDER BY id`);
    snapshot[table] = { rows, columns: fields.map(f => f.name) };
  }
  await source.rollback();
  await dest.beginTransaction();
  // Copia exacta de todas las columnas originales, incluido contenido privado heredado.
  // Esta base de ensayo no se conecta a endpoints públicos.
  for (const table of tables) {
    const { rows, columns } = snapshot[table];
    for (let start = 0; start < rows.length; start += 100) {
      const batch = rows.slice(start, start + 100).map(r => columns.map(k => r[k]));
      await dest.query(`INSERT INTO ${qi(table)} (${columns.map(qi).join(',')}) VALUES ?`, [batch]);
    }
  }
  await dest.query("INSERT INTO currencies VALUES ('USD','Dólar estadounidense'),('PEN','Sol peruano')");
  await dest.query(`UPDATE properties SET currency_code = CASE TRIM(moneda)
    WHEN 'US$' THEN 'USD' WHEN 'US$ c/u' THEN 'USD' WHEN 'S/' THEN 'PEN' ELSE NULL END,
    price_basis = CASE WHEN TRIM(moneda) = 'US$ c/u' THEN 'per_unit' ELSE NULL END`);
  for (const [table, oldKey] of [['sub_properties', 'property_id'], ['mas_info', 'id_properties']]) {
    await dest.query(`UPDATE ${qi(table)} child JOIN properties p ON p.id=child.${qi(oldKey)} SET child.property_ref_id=p.id`);
    await dest.query(`INSERT INTO migration_issues (source_table,source_id,issue_code)
      SELECT ?, id, 'orphan_property' FROM ${qi(table)} WHERE property_ref_id IS NULL`, [table]);
  }
  await dest.query(`INSERT INTO migration_issues (source_table,source_id,issue_code)
    SELECT 'properties',id,'unknown_currency' FROM properties WHERE currency_code IS NULL`);
  await dest.query(`INSERT INTO migration_issues (source_table,source_id,issue_code)
    SELECT 'properties',id,'zero_area_review' FROM properties WHERE area=0`);
  await dest.query(`INSERT INTO migration_issues (source_table,source_id,issue_code)
    SELECT 'properties',id,'empty_address_review' FROM properties WHERE TRIM(address)=''`);
  await dest.query(`INSERT INTO migration_issues (source_table,source_id,issue_code)
    SELECT 'sub_properties',s.id,'duplicate_gallery_order' FROM sub_properties s
    JOIN (SELECT property_id,\`order\` FROM sub_properties GROUP BY property_id,\`order\` HAVING COUNT(*)>1) d
    ON s.property_id=d.property_id AND s.\`order\`=d.\`order\``);
  await dest.query('INSERT INTO publications (property_id) SELECT id FROM properties');
  // Compara contenido de todas las columnas originales contra la instantánea leída.
  for (const table of tables) {
    const { rows, columns } = snapshot[table];
    const [copied] = await dest.query(`SELECT ${columns.map(qi).join(',')} FROM ${qi(table)} ORDER BY id`);
    const matches = hash(rows) === hash(copied);
    report.tables[table] = { sourceRows: rows.length, targetRows: copied.length, identicalOriginalFields: matches };
    if (!matches) throw new Error(`Contenido distinto en ${table}`);
  }
  const [issues] = await dest.query('SELECT issue_code,COUNT(*) AS total FROM migration_issues GROUP BY issue_code');
  const [[pub]] = await dest.query("SELECT COUNT(*) AS total, SUM(publication_status='published') AS published FROM publications");
  report.checks = { issues, publications: pub, sourceWrites: false, productionConnectionChanged: false };
  report.completedAt = new Date().toISOString();
  await dest.query('INSERT INTO migration_runs (completed_at,summary) VALUES (UTC_TIMESTAMP(),?)', [JSON.stringify(report)]);
  await dest.commit();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await source.rollback().catch(() => {});
  await dest.rollback().catch(() => {});
  // DDL no se revierte: no borrar tablas automáticamente ante fallos.
  console.error('Proceso detenido:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await source.end(); await dest.end();
}
