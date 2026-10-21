export const PUBLICATION_STATES = ['pending_review', 'published', 'suspended', 'withdrawn'];

export function validatePublicationChange(change) {
  if (!Number.isSafeInteger(change.id) || change.id < 1) throw new Error('ID inválido');
  if (!PUBLICATION_STATES.includes(change.expected) || !PUBLICATION_STATES.includes(change.status)) throw new Error('Estado inválido');
  if (change.expected === change.status) throw new Error('El estado no cambia');
  for (const field of ['actor', 'reason']) {
    if (typeof change[field] !== 'string' || change[field].trim().length < 3 || change[field].length > 191) throw new Error('Responsable y motivo obligatorios (3–191 caracteres)');
  }
  if (change.status === 'published' && change.confirmPublicData !== true) throw new Error('Confirmar autorización de datos y fotos antes de publicar');
}

export async function changePublication(db, change) {
  validatePublicationChange(change);
  await db.beginTransaction();
  try {
    const [[current]] = await db.query('SELECT publication_status, approved_at FROM publications WHERE property_id=? FOR UPDATE', [change.id]);
    if (!current || current.publication_status !== change.expected) throw new Error('Estado modificado o inmueble inexistente: volver a consultar');
    await db.query(`UPDATE publications SET publication_status=?, approved_at=CASE WHEN ?='published' THEN UTC_TIMESTAMP() ELSE approved_at END WHERE property_id=?`, [change.status, change.status, change.id]);
    await db.query(`INSERT INTO publication_events (property_id, previous_status, next_status, actor, reason, public_data_confirmed, db_principal)
      VALUES (?,?,?,?,?,?,CURRENT_USER())`, [change.id, current.publication_status, change.status, change.actor.trim(), change.reason.trim(), change.status === 'published']);
    await db.commit();
    return { id: change.id, previous: current.publication_status, status: change.status };
  } catch (error) { await db.rollback(); throw error; }
}
