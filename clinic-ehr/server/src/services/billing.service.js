const pool = require('../db/pool');

const VALID_FEE_TYPES     = ['full', 'discounted', 'free', 'custom'];
const VALID_PAY_STATUSES  = ['pending', 'paid', 'waived'];

class BillingService {
  async getByAppointment(appointmentId) {
    const { rows } = await pool.query(
      `SELECT b.*, u.name AS created_by_name
       FROM appointment_billing b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.appointment_id = $1`,
      [appointmentId]
    );
    return rows[0] || null;
  }

  async upsert({ appointmentId, feeType, feeAmount, discountAmount, paymentStatus, notes, userId }) {
    if (feeType && !VALID_FEE_TYPES.includes(feeType)) {
      throw new Error(`Invalid fee_type: ${feeType}`);
    }
    if (paymentStatus && !VALID_PAY_STATUSES.includes(paymentStatus)) {
      throw new Error(`Invalid payment_status: ${paymentStatus}`);
    }

    const { rows } = await pool.query(
      `INSERT INTO appointment_billing
         (appointment_id, fee_type, fee_amount, discount_amount, payment_status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (appointment_id) DO UPDATE SET
         fee_type        = EXCLUDED.fee_type,
         fee_amount      = EXCLUDED.fee_amount,
         discount_amount = EXCLUDED.discount_amount,
         payment_status  = EXCLUDED.payment_status,
         notes           = EXCLUDED.notes,
         updated_at      = NOW()
       RETURNING *`,
      [
        appointmentId,
        feeType        || 'full',
        feeAmount      ?? null,
        discountAmount ?? null,
        paymentStatus  || 'pending',
        notes          || null,
        userId,
      ]
    );
    return rows[0];
  }
}

module.exports = new BillingService();
