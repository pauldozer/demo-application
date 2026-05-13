const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { body, validationResult } = require('express-validator');
const pool     = require('../db/pool');
const { verifyToken } = require('../middleware/auth');
const { auditLog }    = require('../middleware/audit');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

// ── POST /api/auth/login ────────────────────────────────
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username.toLowerCase().trim()]
    );

    const user = rows[0];

    // Use constant-time compare even when user not found (prevent timing attacks)
    const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhashinvalidhashXXXXXXXXXXXXX';
    const isValid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isValid) {
      await auditLog({
        action: 'login_failed',
        entityType: 'user',
        ipAddress: req.ip,
        newValues: { username }
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const rawRefresh = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshHash, refreshExpiry]
    );

    await auditLog({
      userId: user.id,
      action: 'login_success',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    return res
      .cookie('access_token', accessToken,  { ...COOKIE_OPTS, maxAge: 8 * 60 * 60 * 1000 })
      .cookie('refresh_token', rawRefresh,  { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({
        user: { id: user.id, name: user.name, username: user.username, role: user.role }
      });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/logout ───────────────────────────────
router.post('/logout', verifyToken, async (req, res) => {
  const rawRefresh = req.cookies.refresh_token;

  if (rawRefresh) {
    const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [hash]
    ).catch(console.error);
  }

  await auditLog({
    userId: req.user.id,
    action: 'logout',
    entityType: 'user',
    entityId: req.user.id,
    ipAddress: req.ip
  });

  return res
    .clearCookie('access_token',  COOKIE_OPTS)
    .clearCookie('refresh_token', COOKIE_OPTS)
    .json({ message: 'Logged out' });
});

// ── GET /api/auth/me ────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, username, role FROM users WHERE id = $1 AND is_active = true',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/refresh ──────────────────────────────
router.post('/refresh', async (req, res) => {
  const rawRefresh = req.cookies.refresh_token;
  if (!rawRefresh) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const hash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

  try {
    const { rows } = await pool.query(
      `SELECT rt.user_id, u.name, u.username, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()`,
      [hash]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      res.clearCookie('access_token',  COOKIE_OPTS);
      res.clearCookie('refresh_token', COOKIE_OPTS);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const u = rows[0];
    const accessToken = jwt.sign(
      { id: u.user_id, username: u.username, role: u.role, name: u.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res
      .cookie('access_token', accessToken, { ...COOKIE_OPTS, maxAge: 8 * 60 * 60 * 1000 })
      .json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/auth/password ──────────────────────────────
router.put('/password', verifyToken, [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { current_password, new_password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.id]
    );

    // Revoke all existing refresh tokens (forces re-login on other devices)
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [req.user.id]
    );

    await auditLog({
      userId: req.user.id,
      action: 'change_password',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip
    });

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
