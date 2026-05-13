const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/roles');
const { auditLog }     = require('../middleware/audit');
const PatientService   = require('../services/patient.service');

const router = express.Router();

// All patient routes require a valid session
router.use(verifyToken);

// ── GET /api/patients ───────────────────────────────────
// Query params: q, page, limit
router.get('/', async (req, res) => {
  try {
    const q      = (req.query.q     || '').trim();
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;

    const result = await PatientService.search({ query: q, limit, offset });
    return res.json({ ...result, page, limit });
  } catch (err) {
    console.error('Patient search error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/patients ──────────────────────────────────
router.post('/', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('full_name_en').optional().trim(),
  body('dob').optional({ nullable: true }).isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
  body('blood_type').optional({ nullable: true })
    .isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']),
  body('phone').optional({ nullable: true }).trim(),
  body('phone_alt').optional({ nullable: true }).trim(),
  body('allergies').optional().isArray(),
  body('chronic_conditions').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const patient = await PatientService.create({
      ...req.body,
      created_by: req.user.id
    });

    await auditLog({
      userId:     req.user.id,
      action:     'create_patient',
      entityType: 'patient',
      entityId:   patient.id,
      newValues:  { patient_number: patient.patient_number, full_name: patient.full_name },
      ipAddress:  req.ip,
      userAgent:  req.get('user-agent')
    });

    return res.status(201).json(patient);
  } catch (err) {
    console.error('Create patient error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/patients/:id ───────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const patient = await PatientService.getById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Log view (async, don't await)
    auditLog({
      userId:     req.user.id,
      action:     'view_patient',
      entityType: 'patient',
      entityId:   patient.id,
      ipAddress:  req.ip,
      userAgent:  req.get('user-agent')
    });

    return res.json(patient);
  } catch (err) {
    console.error('Get patient error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/patients/:id ───────────────────────────────
router.put('/:id', [
  body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('dob').optional({ nullable: true }).isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
  body('blood_type').optional({ nullable: true })
    .isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']),
  body('allergies').optional().isArray(),
  body('chronic_conditions').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const existing = await PatientService.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = await PatientService.update(req.params.id, req.body);

    await auditLog({
      userId:     req.user.id,
      action:     'update_patient',
      entityType: 'patient',
      entityId:   patient.id,
      oldValues:  { full_name: existing.full_name, phone: existing.phone },
      newValues:  req.body,
      ipAddress:  req.ip,
      userAgent:  req.get('user-agent')
    });

    return res.json(patient);
  } catch (err) {
    console.error('Update patient error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/patients/:id  (admin only) ──────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const existing = await PatientService.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await PatientService.delete(req.params.id);

    await auditLog({
      userId:     req.user.id,
      action:     'delete_patient',
      entityType: 'patient',
      entityId:   req.params.id,
      oldValues:  { patient_number: existing.patient_number, full_name: existing.full_name },
      ipAddress:  req.ip,
      userAgent:  req.get('user-agent')
    });

    return res.json({ message: 'Patient deleted' });
  } catch (err) {
    console.error('Delete patient error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
