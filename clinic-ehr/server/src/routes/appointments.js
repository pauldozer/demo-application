const express = require('express');
const { verifyToken }      = require('../middleware/auth');
const { auditLog }         = require('../middleware/audit');
const AppointmentService   = require('../services/appointment.service');

const router = express.Router();
router.use(verifyToken);

async function broadcastQueue(req, date) {
  const io = req.app.get('io');
  const queue = await AppointmentService.getTodayQueue(date);
  io.emit('queue:updated', { date, queue });
}

// ── GET /api/appointments?date=&from=&to=&doctor_id=&patient_id= ──
router.get('/', async (req, res) => {
  try {
    const { date, from, to, doctor_id, patient_id } = req.query;
    const rows = await AppointmentService.list({ date, from, to, doctorId: doctor_id, patientId: patient_id });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/appointments/queue?date= ──────────────────
router.get('/queue', async (req, res) => {
  try {
    const queue = await AppointmentService.getTodayQueue(req.query.date);
    res.json(queue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/appointments/doctors ──────────────────────
router.get('/doctors', async (req, res) => {
  try {
    res.json(await AppointmentService.getDoctors());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/appointments/:id ──────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const appt = await AppointmentService.getById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Not found' });
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/appointments ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, scheduled_at, duration_mins, type, notes } = req.body;
    if (!patient_id || !doctor_id || !scheduled_at) {
      return res.status(400).json({ error: 'patient_id, doctor_id, scheduled_at required' });
    }

    const appt = await AppointmentService.create({
      patientId: patient_id, doctorId: doctor_id,
      scheduledAt: scheduled_at, durationMins: duration_mins,
      type, notes, createdBy: req.user.id,
    });

    await auditLog({
      userId: req.user.id, action: 'create_appointment',
      entityType: 'appointment', entityId: appt.id,
      newValues: { patient_id, doctor_id, scheduled_at },
      ipAddress: req.ip,
    });

    const date = new Date(scheduled_at).toISOString().split('T')[0];
    await broadcastQueue(req, date);

    res.status(201).json(appt);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That time slot is already booked for this doctor' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/appointments/:id ──────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { scheduled_at, duration_mins, type, notes } = req.body;
    const existing = await AppointmentService.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const appt = await AppointmentService.update(req.params.id, {
      scheduledAt: scheduled_at, durationMins: duration_mins, type, notes,
    });

    const date = new Date(appt.scheduled_at).toISOString().split('T')[0];
    await broadcastQueue(req, date);

    res.json(appt);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That time slot is already booked for this doctor' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/appointments/:id/status ────────────────
const VALID_STATUSES = ['scheduled','confirmed','arrived','in_progress','completed','cancelled','no_show'];

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` });
    }

    const appt = await AppointmentService.updateStatus(req.params.id, status);
    if (!appt) return res.status(404).json({ error: 'Not found' });

    await auditLog({
      userId: req.user.id, action: 'update_appointment_status',
      entityType: 'appointment', entityId: appt.id,
      newValues: { status }, ipAddress: req.ip,
    });

    const date = new Date(appt.scheduled_at).toISOString().split('T')[0];
    await broadcastQueue(req, date);
    req.app.get('io').emit('appointment:updated', appt);

    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/appointments/:id (cancel) ─────────────
router.delete('/:id', async (req, res) => {
  try {
    const appt = await AppointmentService.updateStatus(req.params.id, 'cancelled');
    if (!appt) return res.status(404).json({ error: 'Not found' });

    await auditLog({
      userId: req.user.id, action: 'cancel_appointment',
      entityType: 'appointment', entityId: appt.id,
      ipAddress: req.ip,
    });

    const date = new Date(appt.scheduled_at).toISOString().split('T')[0];
    await broadcastQueue(req, date);

    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
