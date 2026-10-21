import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import mysql from '../node_modules/mysql2/promise.js';

const v = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const target = 'inmobi16_portal';
assert.notEqual(v.DB_NAME, target);
const db = await mysql.createConnection({ host: v.DB_HOST, port: Number(v.DB_PORT),
  user: v.DB_USER, password: v.DB_PASSWORD, database: target, dateStrings: true });
const qi = mysql.escapeId;
const directory = '/tmp/alfaro-permission-check';
const backup = { database: target, createdAt: new Date().toISOString(), tables: {}, views: {} };
try {
  const [[identity]] = await db.query('SELECT DATABASE() AS name');
  assert.equal(identity.name, target);
  const [objects] = await db.query('SHOW FULL TABLES');
  await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  for (const object of objects) {
    const [name, type] = Object.values(object);
    if (type === 'VIEW') {
      const [[ddl]] = await db.query(`SHOW CREATE VIEW ${qi(name)}`);
      backup.views[name] = ddl['Create View'];
    } else {
      const [[ddl]] = await db.query(`SHOW CREATE TABLE ${qi(name)}`);
      const [rows] = await db.query(`SELECT * FROM ${qi(name)} ORDER BY 1`);
      backup.tables[name] = { ddl: ddl['Create Table'], rows };
    }
  }
  await db.rollback();
  const serialized = JSON.stringify(backup);
  const backupPath = `${directory}/portal-before-v2-${Date.now()}.json`;
  fs.writeFileSync(backupPath, serialized, { mode: 0o600 });
  assert.deepEqual(JSON.parse(fs.readFileSync(backupPath, 'utf8')), backup);
  const report = { database: target, backupSha256: crypto.createHash('sha256').update(serialized).digest('hex'),
    backupPath, applied: [], checks: {} };
  const constraints = [
    ['properties', 'ck_property_price_nonnegative', 'price >= 0'],
    ['properties', 'ck_property_area_nonnegative', 'area >= 0'],
    ['properties', 'ck_price_basis', "price_basis IS NULL OR price_basis = 'per_unit'"],
    ['sub_properties', 'ck_gallery_reference_matches', 'property_ref_id IS NULL OR property_ref_id = property_id'],
    ['mas_info', 'ck_info_reference_matches', 'property_ref_id IS NULL OR property_ref_id = id_properties'],
    ['publications', 'ck_publication_approval', "publication_status <> 'published' OR approved_at IS NOT NULL"],
  ];
  for (const [table, name, expression] of constraints) {
    const [present] = await db.query('SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME=?', [table, name]);
    if (!present.length) {
      await db.query(`ALTER TABLE ${qi(table)} ADD CONSTRAINT ${qi(name)} CHECK (${expression})`);
      report.applied.push(name);
    }
  }
  // Lista explícita de campos públicos: excluye propietario y referencias internas.
  await db.query(`CREATE OR REPLACE SQL SECURITY INVOKER VIEW public_properties AS
    SELECT p.id,p.title,p.image,p.price,p.moneda,p.currency_code,p.price_basis,
      p.location,p.address,p.status,p.bedrooms,p.bathrooms,p.area,p.created_at,p.destacado,
      p.description,p.latitude,p.longitude,p.frontera,p.largo,p.area_c,p.cocheras,
      p.distribution,p.antiguedad,p.cerco_perimetrico,p.garantia,p.adelanto
    FROM properties p JOIN publications pub ON pub.property_id=p.id
    WHERE pub.publication_status='published' AND pub.approved_at IS NOT NULL`);
  await db.query(`CREATE OR REPLACE SQL SECURITY INVOKER VIEW public_property_gallery AS
    SELECT s.id,s.property_ref_id AS property_id,s.content,s.image,s.\`order\`,s.text_content
    FROM sub_properties s JOIN public_properties p ON p.id=s.property_ref_id`);
  await db.query(`CREATE OR REPLACE SQL SECURITY INVOKER VIEW public_property_info AS
    SELECT m.id,m.titulo_info,m.descripcion_info,m.property_ref_id AS id_properties
    FROM mas_info m JOIN public_properties p ON p.id=m.property_ref_id`);
  report.applied.push('public_properties', 'public_property_gallery', 'public_property_info');
  await db.beginTransaction();
  try {
    const [[property]] = await db.query('SELECT id FROM properties ORDER BY id LIMIT 1');
    const id = property.id;
    const [[before]] = await db.query('SELECT COUNT(*) AS total FROM public_properties');
    assert.equal(before.total, 0, 'Este ensayo requiere publicaciones pendientes');
    let approvalRejected = false;
    try { await db.query("UPDATE publications SET publication_status='published',approved_at=NULL WHERE property_id=?", [id]); }
    catch (error) { if (error.code !== 'ER_CHECK_CONSTRAINT_VIOLATED') throw error; approvalRejected = true; }
    assert.ok(approvalRejected);
    await db.query("UPDATE publications SET publication_status='published',approved_at=UTC_TIMESTAMP() WHERE property_id=?", [id]);
    const [visible, fields] = await db.query('SELECT * FROM public_properties WHERE id=?', [id]);
    assert.equal(visible.length, 1);
    assert.ok(!fields.some(f => ['propietario', 'internal_reference'].includes(f.name)));
    const [[gallery]] = await db.query('SELECT COUNT(*) AS total FROM public_property_gallery WHERE property_id=?', [id]);
    const [[expectedGallery]] = await db.query('SELECT COUNT(*) AS total FROM sub_properties WHERE property_ref_id=?', [id]);
    assert.equal(gallery.total, expectedGallery.total);
    await db.query("UPDATE publications SET publication_status='suspended' WHERE property_id=?", [id]);
    for (const [view, key] of [['public_properties','id'], ['public_property_gallery','property_id'], ['public_property_info','id_properties']]) {
      const [[count]] = await db.query(`SELECT COUNT(*) AS total FROM ${qi(view)} WHERE ${qi(key)}=?`, [id]);
      assert.equal(count.total, 0);
    }
    let negativeRejected = false;
    try { await db.query('UPDATE properties SET price=-1 WHERE id=?', [id]); }
    catch (error) { if (error.code !== 'ER_CHECK_CONSTRAINT_VIOLATED') throw error; negativeRejected = true; }
    assert.ok(negativeRejected);
    report.checks = { approvalRequired: true, publicationVisibility: true, privateFieldsExcluded: true,
      relatedGalleryMatches: true, suspensionHidesAllViews: true, negativePriceRejected: true, testChangesRolledBack: true };
  } finally { await db.rollback(); }
  for (const [name, item] of Object.entries(backup.tables)) {
    const columns = Object.keys(item.rows[0] || {});
    if (!columns.length) continue;
    const [after] = await db.query(`SELECT ${columns.map(qi).join(',')} FROM ${qi(name)} ORDER BY 1`);
    assert.deepEqual(after, item.rows, `Datos conservados: ${name}`);
  }
  report.checks.allOriginalRowsUnchanged = true;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync('actualizaciones/RESULTADO-MEJORAS-PORTAL-F3-2026-10-21.json', JSON.stringify(report, null, 2)+'\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await db.rollback().catch(() => {});
  console.error('Proceso detenido:', error.code || error.message);
  process.exitCode = 1;
} finally { await db.end(); }
