const express = require('express');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool           = require('../db/pool');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/roles');
const { auditLog }     = require('../middleware/audit');

const router = express.Router();

router.use(verifyToken);

// ── GET /api/users  (admin only) ───────────────────────
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, username, role, is_active, created_at FROM users ORDER BY name'
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/users  (admin only) ──────────────────────
router.post('/', requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().notEmpty().withMessage('Username is required')
    .matches(/^[a-z0-9._-]+$/).withMessage('Username: lowercase letters, numbers, ., _, - only'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  body('role').isIn(['admin', 'doctor', 'assistant']).withMessage('Invalid role'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username, password, role } = req.body;

  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, username, role, is_active, created_at`,
      [name.trim(), username.toLowerCase(), hash, role]
    );

    await auditLog({
      userId:     req.user.id,
      action:     'create_user',
      entityType: 'user',
      entityId:   rows[0].id,
      newValues:  { name, username, role },
      ipAddress:  req.ip
    });

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/users/:id  (admin only) ───────────────────
router.put('/:id', requireRole('admin'), [
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(['admin', 'doctor', 'assistant']),
  body('is_active').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Prevent admin from deactivating their own account
  if (req.params.id === req.user.id && req.body.is_active === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  try {
    const ALLOWED = ['name', 'role', 'is_active'];
    const sets    = [];
    const vals    = [];
    let   idx     = 1;

    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = $${idx++}`);
        vals.push(req.body[field]);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    sets.push('updated_at = NOW()');
    vals.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}
       RETURNING id, name, username, role, is_active`,
      vals
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await auditLog({
      userId:     req.user.id,
      action:     'update_user',
      entityType: 'user',
      entityId:   req.params.id,
      newValues:  req.body,
      ipAddress:  req.ip
    });

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/users/:id/reset-password  (admin only) ────
router.put('/:id/reset-password', requireRole('admin'), [
  body('new_password')
    .isLength({ min: 8 }).withMessage('At least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[0-9]/).withMessage('Must contain a number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const hash = await bcrypt.hash(req.body.new_password, 12);
    const { rowCount } = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });

    // Revoke all refresh tokens for that user
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [req.params.id]
    );

    await auditLog({
      userId:     req.user.id,
      action:     'reset_user_password',
      entityType: 'user',
      entityId:   req.params.id,
      ipAddress:  req.ip
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
