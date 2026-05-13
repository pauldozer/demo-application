const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken }         = require('../middleware/auth');
const { requireRole }         = require('../middleware/roles');
const { auditLog }            = require('../middleware/audit');
const ConsultationService     = require('../services/consultation.service');

const router = express.Router();
router.use(verifyToken);

// ── POST /api/consultations ─────────────────────────────
// Doctors and admins only
router.post('/', requireRole('doctor', 'admin'), [
  body('patient_id').isUUID().withMessage('Valid patient_id required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const consult = await ConsultationService.create({
      ...req.body,
      doctor_id: req.user.id
    });

    await auditLog({
      userId: req.user.id, action: 'create_consultation',
      entityType: 'consultation', entityId: consult.id,
      newValues: { patient_id: consult.patient_id },
      ipAddress: req.ip
    });

    return res.status(201).json(consult);
  } catch (err) {
    console.error('Create consultation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/consultations/:id ──────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const consult = await ConsultationService.getById(req.params.id);
    if (!consult) return res.status(404).json({ error: 'Consultation not found' });

    // Doctors can only read their own consultations (admins see all)
    if (req.user.role === 'doctor' && consult.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return res.json(consult);
  } catch (err) {
    console.error('Get consultation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/consultations/:id ──────────────────────────
router.put('/:id', requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const existing = await ConsultationService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Consultation not found' });

    if (req.user.role === 'doctor' && existing.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Cannot edit another doctor\'s consultation' });
    }

    if (existing.status === 'complete' && req.body.status !== 'complete') {
      return res.status(400).json({ error: 'Completed consultations cannot be re-opened' });
    }

    const consult = await ConsultationService.update(req.params.id, req.body);

    await auditLog({
      userId: req.user.id, action: 'update_consultation',
      entityType: 'consultation', entityId: req.params.id,
      ipAddress: req.ip
    });

    return res.json(consult);
  } catch (err) {
    console.error('Update consultation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/consultations/:id/complete ─────────────────
router.put('/:id/complete', requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const existing = await ConsultationService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Consultation not found' });

    if (req.user.role === 'doctor' && existing.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Save any final data before marking complete
    if (Object.keys(req.body).length > 0) {
      await ConsultationService.update(req.params.id, req.body);
    }
    const consult = await ConsultationService.markComplete(req.params.id);

    await auditLog({
      userId: req.user.id, action: 'complete_consultation',
      entityType: 'consultation', entityId: req.params.id,
      ipAddress: req.ip
    });

    return res.json(consult);
  } catch (err) {
    console.error('Complete consultation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
