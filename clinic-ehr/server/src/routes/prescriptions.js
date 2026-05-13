const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken }     = require('../middleware/auth');
const { requireRole }     = require('../middleware/roles');
const { auditLog }        = require('../middleware/audit');
const pool                = require('../db/pool');

const router = express.Router();
router.use(verifyToken);

// ── POST /api/prescriptions ─────────────────────────────
router.post('/', requireRole('doctor', 'admin'), [
  body('patient_id').isUUID(),
  body('medication_name').trim().notEmpty().withMessage('Medication name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    patient_id, consultation_id, medication_id, medication_name,
    dosage, frequency, duration, instructions
  } = req.body;

  try {
    const { rows } = await pool.query(`
      INSERT INTO prescriptions (
        patient_id, consultation_id, doctor_id, medication_id, medication_name,
        dosage, frequency, duration, instructions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      patient_id,
      consultation_id || null,
      req.user.id,
      medication_id   || null,
      medication_name.trim(),
      dosage          || null,
      frequency       || null,
      duration        || null,
      instructions    || null
    ]);

    await auditLog({
      userId: req.user.id, action: 'create_prescription',
      entityType: 'prescription', entityId: rows[0].id,
      newValues: { patient_id, medication_name },
      ipAddress: req.ip
    });

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create prescription error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/prescriptions/:id/stop ────────────────────
router.put('/:id/stop', requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE prescriptions
      SET is_current = false, stopped_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Prescription not found' });

    await auditLog({
      userId: req.user.id, action: 'stop_prescription',
      entityType: 'prescription', entityId: req.params.id,
      ipAddress: req.ip
    });

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
