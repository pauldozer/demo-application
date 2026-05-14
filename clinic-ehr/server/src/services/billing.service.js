const pool = require('../db/pool');

const VALID_FEE_TYPES    = ['full', 'discounted', 'free', 'custom'];
const VALID_PAY_STATUSES = ['pending', 'paid', 'waived'];

// Net amount earned from a billing record
const NET_EXPR = `
  CASE
    WHEN b.fee_type = 'free'       THEN 0
    WHEN b.fee_type = 'discounted' THEN COALESCE(b.fee_amount, 0) - COALESCE(b.discount_amount, 0)
    ELSE COALESCE(b.fee_amount, 0)
  END
`;

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
       VALUES ($1,$2,$3,$4,$5,$6,$7)
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

  // Revenue summary: today / this week / this month
  // doctorId: null = all doctors (admin/assistant view)
  async getRevenue(doctorId = null) {
    const docFilter = doctorId ? 'AND a.doctor_id = $1' : '';
    const params    = doctorId ? [doctorId] : [];

    const { rows: [totals] } = await pool.query(`
      WITH paid AS (
        SELECT
          ${NET_EXPR} AS net,
          a.scheduled_at::date AS appt_date
        FROM appointment_billing b
        JOIN appointments a ON b.appointment_id = a.id
        WHERE b.payment_status = 'paid'
          AND a.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '7 days'
          ${docFilter}
      ),
      pending AS (
        SELECT COUNT(*)::int AS cnt
        FROM appointment_billing b
        JOIN appointments a ON b.appointment_id = a.id
        WHERE b.payment_status = 'pending'
          AND a.scheduled_at::date = CURRENT_DATE
          ${docFilter}
      )
      SELECT
        COALESCE(SUM(net) FILTER (WHERE appt_date = CURRENT_DATE), 0)::numeric                               AS today,
        COALESCE(SUM(net) FILTER (WHERE appt_date >= DATE_TRUNC('week', CURRENT_DATE)::date), 0)::numeric   AS week,
        COALESCE(SUM(net) FILTER (WHERE appt_date >= DATE_TRUNC('month', CURRENT_DATE)::date), 0)::numeric  AS month,
        (SELECT cnt FROM pending)                                                                              AS today_pending
      FROM paid
    `, params);

    // Per-doctor breakdown (only for admin/assistant — when doctorId is null)
    let byDoctor = [];
    if (!doctorId) {
      const { rows } = await pool.query(`
        SELECT
          a.doctor_id,
          u.name AS doctor_name,
          COALESCE(SUM(${NET_EXPR}) FILTER (
            WHERE b.payment_status = 'paid'
              AND a.scheduled_at::date = CURRENT_DATE
          ), 0)::numeric AS today,
          COALESCE(SUM(${NET_EXPR}) FILTER (
            WHERE b.payment_status = 'paid'
              AND a.scheduled_at::date >= DATE_TRUNC('week', CURRENT_DATE)::date
          ), 0)::numeric AS week,
          COALESCE(SUM(${NET_EXPR}) FILTER (
            WHERE b.payment_status = 'paid'
              AND a.scheduled_at::date >= DATE_TRUNC('month', CURRENT_DATE)::date
          ), 0)::numeric AS month
        FROM appointment_billing b
        JOIN appointments a ON b.appointment_id = a.id
        JOIN users u ON a.doctor_id = u.id
        WHERE a.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '7 days'
        GROUP BY a.doctor_id, u.name
        ORDER BY month DESC
      `);
      byDoctor = rows;
    }

    return {
      today:         parseFloat(totals.today  || 0),
      week:          parseFloat(totals.week   || 0),
      month:         parseFloat(totals.month  || 0),
      today_pending: totals.today_pending || 0,
      by_doctor:     byDoctor.map(r => ({
        doctor_id:   r.doctor_id,
        doctor_name: r.doctor_name,
        today:       parseFloat(r.today  || 0),
        week:        parseFloat(r.week   || 0),
        month:       parseFloat(r.month  || 0),
      })),
    };
  }
}

module.exports = new BillingService();
