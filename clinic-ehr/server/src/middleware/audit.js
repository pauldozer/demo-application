const pool = require('../db/pool');

async function auditLog({ userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId   || null,
        action,
        entityType || null,
        entityId   || null,
        oldValues  ? JSON.stringify(oldValues) : null,
        newValues  ? JSON.stringify(newValues) : null,
        ipAddress  || null,
        userAgent  || null
      ]
    );
  } catch (err) {
    // Never block a request because of an audit log failure
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { auditLog };
