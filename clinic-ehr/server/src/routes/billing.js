const express        = require('express');
const { verifyToken } = require('../middleware/auth');
const { auditLog }    = require('../middleware/audit');
const BillingService  = require('../services/billing.service');

const router = express.Router();
router.use(verifyToken);

// GET /api/billing/:appointmentId
router.get('/:appointmentId', async (req, res) => {
  try {
    const billing = await BillingService.getByAppointment(req.params.appointmentId);
    res.json(billing); // null if not yet set
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/billing  (create or update — upsert)
router.post('/', async (req, res) => {
  try {
    const { appointment_id, fee_type, fee_amount, discount_amount, payment_status, notes } = req.body;
    if (!appointment_id) return res.status(400).json({ error: 'appointment_id required' });

    const billing = await BillingService.upsert({
      appointmentId:  appointment_id,
      feeType:        fee_type,
      feeAmount:      fee_amount      !== undefined ? parseFloat(fee_amount)      : undefined,
      discountAmount: discount_amount !== undefined ? parseFloat(discount_amount) : undefined,
      paymentStatus:  payment_status,
      notes,
      userId: req.user.id,
    });

    await auditLog({
      userId: req.user.id, action: 'upsert_billing',
      entityType: 'appointment_billing', entityId: billing.id,
      newValues: { appointment_id, fee_type, payment_status },
      ipAddress: req.ip,
    });

    res.status(201).json(billing);
  } catch (err) {
    if (err.message.startsWith('Invalid')) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
