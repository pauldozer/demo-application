const pool = require('../db/pool');

const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in_progress'];

const BASE_SELECT = `
  SELECT
    a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.duration_mins,
    a.type, a.status, a.check_in_time, a.notes, a.created_at, a.updated_at,
    p.full_name      AS patient_name,
    p.patient_number,
    p.phone          AS patient_phone,
    u.name           AS doctor_name,
    u.commission_pct AS doctor_commission_pct
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  JOIN users    u ON a.doctor_id  = u.id
`;

class AppointmentService {
  async list({ date, from, to, doctorId, patientId, includeCompleted = true } = {}) {
    const conds = [];
    const params = [];
    let idx = 1;

    if (date) {
      conds.push(`DATE(a.scheduled_at) = $${idx++}`);
      params.push(date);
    }
    if (from) {
      conds.push(`a.scheduled_at >= $${idx++}::date`);
      params.push(from);
    }
    if (to) {
      conds.push(`a.scheduled_at < $${idx++}::date + interval '1 day'`);
      params.push(to);
    }
    if (doctorId) {
      conds.push(`a.doctor_id = $${idx++}`);
      params.push(doctorId);
    }
    if (patientId) {
      conds.push(`a.patient_id = $${idx++}`);
      params.push(patientId);
    }
    if (!includeCompleted) {
      conds.push(`a.status NOT IN ('cancelled', 'no_show')`);
    } else {
      conds.push(`a.status != 'cancelled'`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `${BASE_SELECT} ${where} ORDER BY a.scheduled_at`,
      params
    );
    return rows;
  }

  async getById(id) {
    const { rows } = await pool.query(
      `${BASE_SELECT} WHERE a.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ patientId, doctorId, scheduledAt, durationMins, type, notes, createdBy }) {
    const { rows } = await pool.query(
      `INSERT INTO appointments
         (patient_id, doctor_id, scheduled_at, duration_mins, type, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [patientId, doctorId, scheduledAt, durationMins || 20, type || null, notes || null, createdBy]
    );
    return this.getById(rows[0].id);
  }

  async update(id, { scheduledAt, durationMins, type, notes }) {
    const sets = [`updated_at = NOW()`];
    const params = [id];
    let idx = 2;

    if (scheduledAt  !== undefined) { sets.push(`scheduled_at  = $${idx++}`); params.push(scheduledAt); }
    if (durationMins !== undefined) { sets.push(`duration_mins = $${idx++}`); params.push(durationMins); }
    if (type         !== undefined) { sets.push(`type          = $${idx++}`); params.push(type); }
    if (notes        !== undefined) { sets.push(`notes         = $${idx++}`); params.push(notes); }

    await pool.query(
      `UPDATE appointments SET ${sets.join(', ')} WHERE id = $1`,
      params
    );
    return this.getById(id);
  }

  async updateStatus(id, status) {
    const checkIn = status === 'arrived' ? ', check_in_time = NOW()' : '';
    await pool.query(
      `UPDATE appointments SET status = $2, updated_at = NOW()${checkIn} WHERE id = $1`,
      [id, status]
    );
    return this.getById(id);
  }

  async getTodayQueue(date) {
    const d = date || new Date().toISOString().split('T')[0];
    return this.list({ date: d, includeCompleted: true });
  }

  async getDoctors() {
    const { rows } = await pool.query(
      `SELECT id, name FROM users
       WHERE role IN ('doctor','admin') AND is_active = true
       ORDER BY name`
    );
    return rows;
  }
}

module.exports = new AppointmentService();
