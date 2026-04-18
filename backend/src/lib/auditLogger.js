async function logAction(conn, userId, action, entity, entityId, metadata) {
  await conn.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId || null,
      action,
      entity,
      entityId || null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

module.exports = { logAction };
