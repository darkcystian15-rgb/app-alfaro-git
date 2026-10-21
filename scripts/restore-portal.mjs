import mysql from 'mysql2/promise';
import assert from 'node:assert/strict';

// Solo destinos locales vacíos: nunca restaurar sobre el hosting del portal.
export async function restoreSnapshot(db, snapshot) {
  assert.ok(['127.0.0.1','localhost','::1'].includes(db.connection.config.host), 'Solo se permite restaurar en MySQL local aislado');
  const [[identity]] = await db.query('SELECT DATABASE() AS name, @@hostname AS host');
  assert.match(identity.name, /^alfaro_restore_[a-z0-9_]+$/);
  const [existing] = await db.query('SHOW TABLES');
  assert.equal(existing.length, 0, 'La restauración exige una base vacía');
  assert.equal(snapshot.database, 'inmobi16_portal');
  // El origen contiene fechas cero heredadas: preservarlas en esta sesión aislada.
  const [[mode]] = await db.query('SELECT @@SESSION.sql_mode AS value');
  await db.query('SET SESSION sql_mode=?', [mode.value.split(',').filter(value => !['NO_ZERO_DATE','NO_ZERO_IN_DATE'].includes(value)).join(',')]);
  const qi = mysql.escapeId;
  await db.query('SET FOREIGN_KEY_CHECKS=0');
  try {
    for (const [name, table] of Object.entries(snapshot.tables)) {
      await db.query(table.ddl);
      const columns = table.columns || Object.keys(table.rows[0] || {});
      for (let start = 0; start < table.rows.length; start += 100) {
        const batch = table.rows.slice(start, start + 100).map(row => columns.map(key => {
          const value = row[key];
          return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
        }));
        await db.query(`INSERT INTO ${qi(name)} (${columns.map(qi).join(',')}) VALUES ?`, [batch]);
      }
    }
  } finally { await db.query('SET FOREIGN_KEY_CHECKS=1'); }
  // Quitar DEFINER y calificaciones al origen; conservar SQL SECURITY y SELECT.
  const pending = new Map(Object.entries(snapshot.views));
  for (let pass = 0; pending.size && pass < Object.keys(snapshot.views).length + 1; pass++) {
    for (const [name, ddl] of pending) {
      const local = ddl.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '')
        .replaceAll('`inmobi16_portal`.', '');
      try { await db.query(local); pending.delete(name); }
      catch (error) { if (error.code !== 'ER_NO_SUCH_TABLE') throw error; }
    }
  }
  assert.equal(pending.size, 0, 'No se pudieron restaurar todas las vistas');
  const counts = {};
  for (const [name, table] of Object.entries(snapshot.tables)) {
    const [rows] = await db.query(`SELECT * FROM ${qi(name)} ORDER BY 1`);
    const expected = [...table.rows].sort((a,b) => String(Object.values(a)[0]).localeCompare(String(Object.values(b)[0]), undefined, {numeric:true}));
    // Serializar conserva el mismo contrato del respaldo lógico (fechas como texto).
    assert.deepEqual(JSON.parse(JSON.stringify(rows)), JSON.parse(JSON.stringify(expected)), `Contenido restaurado: ${name}`);
    counts[name] = rows.length;
  }
  return { tables: counts, views: Object.keys(snapshot.views).length, fullRowsVerified: true };
}
