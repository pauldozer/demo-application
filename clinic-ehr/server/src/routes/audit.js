const express      = require('express');
const pool         = require('../db/pool');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/roles');

const router = express.Router();
router.use(verifyToken);
router.use(requireRole('admin'));

// GET /api/audit-logs?page=1&limit=50&action=&entity_type=&user_id=&from=&to=
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity_type, user_id, from, to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (action)      { conds.push(`a.action ILIKE $${idx++}`);      params.push(`%${action}%`); }
    if (entity_type) { conds.push(`a.entity_type = $${idx++}`);     params.push(entity_type); }
    if (user_id)     { conds.push(`a.user_id = $${idx++}`);         params.push(user_id); }
    if (from)        { conds.push(`a.created_at >= $${idx++}`);     params.push(from); }
    if (to)          { conds.push(`a.created_at < $${idx++}::date + interval '1 day'`); params.push(to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM audit_logs a ${where}`, params),
      pool.query(
        `SELECT
           a.id, a.action, a.entity_type, a.entity_id,
           a.old_values, a.new_values, a.ip_address, a.created_at,
           u.name AS user_name, u.role AS user_role
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), offset]
      )
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      logs:  dataRes.rows,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/audit-logs/users  — list users for filter dropdown
router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT u.id, u.name FROM audit_logs a
       JOIN users u ON a.user_id = u.id
       ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
