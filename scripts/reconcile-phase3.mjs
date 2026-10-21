import mysql from 'mysql2/promise';

const normalized = value => String(value || '').trim().toLowerCase();

// Solo categorías inequívocas en el título actual; no convertir proyectos futuros
// en tipos actuales ni forzar los anuncios de uso mixto al catálogo heredado.
export function explicitType(title, catalog) {
  const text = normalized(title).replace(/\s+/g, ' ');
  if (/industrial|edificio para empresas|oficinas - departamento|casa como terreno|comercio - vivienda/.test(text)) return null;
  let name;
  if (/\bterrenos? comercial/.test(text)) name = 'terreno comercial';
  else if (/\bterrenos?\b/.test(text)) name = 'terreno';
  else if (/\blocal comercial\b/.test(text)) name = 'local comercial';
  else if (/\blocal\b/.test(text)) return null;
  else if (/\bcasa\b/.test(text)) name = 'casa';
  else if (/\bdepartamento\b/.test(text)) name = 'departamento';
  else if (/\boficinas?\b/.test(text)) name = 'oficina';
  else if (/\bhotel\b/.test(text)) name = 'hotel';
  const matches = catalog.filter(row => normalized(row.nombre) === name);
  return matches.length === 1 ? matches[0].id : null;
}

export async function installWorkflow(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS publication_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    previous_status VARCHAR(20) NOT NULL, next_status VARCHAR(20) NOT NULL,
    actor VARCHAR(191) NOT NULL, reason VARCHAR(191) NOT NULL,
    db_principal VARCHAR(288) NOT NULL,
    public_data_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_publication_event FOREIGN KEY (property_id) REFERENCES properties(id),
    INDEX idx_publication_events_property (property_id,id)
  ) ENGINE=InnoDB`);
  const [columns] = await db.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='publication_events' AND COLUMN_NAME='db_principal'");
  if (!columns.length) await db.query("ALTER TABLE publication_events ADD db_principal VARCHAR(288) NOT NULL DEFAULT 'legacy_not_recorded'");
}

export async function reconcile(db, apply = false) {
  const [[identity]] = await db.query('SELECT DATABASE() AS name');
  if (identity.name !== 'inmobi16_portal' && !/^alfaro_restore_[a-z0-9_]+$/.test(identity.name)) throw new Error('Destino no autorizado');
  await db.beginTransaction();
  try {
    const [properties] = await db.query('SELECT id,title,status,location,property_type_id,modality_id,district_id FROM properties ORDER BY id FOR UPDATE');
    const catalogs = {};
    for (const table of ['tipos','modalidades','distritos']) [catalogs[table]] = await db.query(`SELECT id,nombre FROM ${mysql.escapeId(table)}`);
    const report = { applied: apply, assigned: { property_type_id: 0, modality_id: 0, district_id: 0 }, typeReview: [], orphanGalleryQuarantined: 0 };
    for (const property of properties) {
      for (const [field,label,table] of [['property_type_id','title','tipos'],['modality_id','status','modalidades'],['district_id','location','distritos']]) {
        if (property[field] != null) continue;
        const matches = catalogs[table].filter(row => normalized(row.nombre) === normalized(property[label]));
        const id = field === 'property_type_id' ? explicitType(property.title, catalogs.tipos) : matches.length === 1 ? matches[0].id : null;
        if (id != null) {
          await db.query(`UPDATE properties SET ${mysql.escapeId(field)}=? WHERE id=? AND ${mysql.escapeId(field)} IS NULL`, [id,property.id]);
          report.assigned[field]++;
        } else if (field === 'property_type_id') {
          report.typeReview.push(property.id);
          await db.query(`INSERT INTO migration_issues (source_table,source_id,issue_code,details) VALUES ('properties',?,'type_mapping_review',?)
            ON DUPLICATE KEY UPDATE details=VALUES(details)`, [property.id,JSON.stringify({decision:'preserve_legacy_label',reason:'No equivalent unambiguous category; commercial review required'})]);
        }
      }
    }
    const [orphans] = await db.query('SELECT s.id FROM sub_properties s LEFT JOIN properties p ON p.id=s.property_id WHERE p.id IS NULL');
    for (const row of orphans) {
      await db.query(`UPDATE migration_issues SET details=? WHERE source_table='sub_properties' AND source_id=? AND issue_code='orphan_property'`,
        [JSON.stringify({decision:'quarantined',reason:'Missing historical parent; preserve original record, excluded by public view; do not reassign by filename'}), row.id]);
    }
    report.orphanGalleryQuarantined = orphans.length;
    await db.query(`UPDATE migration_issues SET details=? WHERE source_table='properties' AND issue_code='zero_area_review' AND resolved_at IS NULL`,
      [JSON.stringify({decision:'await_verified_measurement',reason:'Do not infer terrain area from office blocks or unrelated information'})]);
    await db.query(`UPDATE migration_issues SET details=? WHERE source_table='properties' AND issue_code='empty_address_review' AND resolved_at IS NULL`,
      [JSON.stringify({decision:'retain_location_only',reason:'Do not add a street or exact address without confirmation of accuracy and public authorization'})]);
    if (apply) await db.commit(); else await db.rollback();
    return report;
  } catch (error) { await db.rollback(); throw error; }
}
