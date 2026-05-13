const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/roles');
const pool             = require('../db/pool');

const router = express.Router();
router.use(verifyToken);

// ── GET /api/medications?q= ─────────────────────────────
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  try {
    const { rows } = await pool.query(`
      SELECT id, name, generic_name, form, strength
      FROM medications
      WHERE is_active = true
        ${q ? "AND (name ILIKE $1 OR generic_name ILIKE $1)" : ''}
      ORDER BY name
      LIMIT 30
    `, q ? [`%${q}%`] : []);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/medications  (admin only) ─────────────────
router.post('/', requireRole('admin'), [
  body('name').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { rows } = await pool.query(`
      INSERT INTO medications (name, generic_name, form, strength)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [
      req.body.name.trim(),
      req.body.generic_name || null,
      req.body.form         || null,
      req.body.strength     || null
    ]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
