const pool = require('../db/pool');

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = parseFloat(height) / 100;
  return parseFloat((parseFloat(weight) / (h * h)).toFixed(1));
}

function hasVitals(data) {
  return ['weight_kg','height_cm','bp_systolic','bp_diastolic',
          'pulse_bpm','temp_celsius','o2_sat_pct'].some(f => data[f] != null && data[f] !== '');
}

const CONSULT_FIELDS = [
  'chief_complaint','subjective','objective','assessment',
  'plan','follow_up_date','follow_up_notes','status','visit_date'
];

const ConsultationService = {

  async listForPatient(patientId) {
    const { rows } = await pool.query(`
      SELECT
        c.id, c.patient_id, c.doctor_id, c.visit_date,
        c.chief_complaint, c.assessment, c.status,
        c.follow_up_date, c.created_at, c.updated_at,
        u.name AS doctor_name,
        v.weight_kg, v.height_cm, v.bmi,
        v.bp_systolic, v.bp_diastolic, v.pulse_bpm, v.temp_celsius, v.o2_sat_pct
      FROM consultations c
      JOIN users u ON c.doctor_id = u.id
      LEFT JOIN vitals v ON v.consultation_id = c.id
      WHERE c.patient_id = $1
      ORDER BY c.visit_date DESC
    `, [patientId]);
    return rows;
  },

  async getById(id) {
    const { rows } = await pool.query(`
      SELECT
        c.*,
        u.name AS doctor_name,
        v.id AS vitals_id, v.weight_kg, v.height_cm, v.bmi,
        v.bp_systolic, v.bp_diastolic, v.pulse_bpm,
        v.temp_celsius, v.o2_sat_pct
      FROM consultations c
      JOIN users u ON c.doctor_id = u.id
      LEFT JOIN vitals v ON v.consultation_id = c.id
      WHERE c.id = $1
    `, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [consult] } = await client.query(`
        INSERT INTO consultations (
          patient_id, doctor_id, visit_date, chief_complaint,
          subjective, objective, assessment, plan,
          follow_up_date, follow_up_notes, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *
      `, [
        data.patient_id,
        data.doctor_id,
        data.visit_date || new Date(),
        data.chief_complaint || null,
        data.subjective     || null,
        data.objective      || null,
        data.assessment     || null,
        data.plan           || null,
        data.follow_up_date || null,
        data.follow_up_notes|| null,
        data.status         || 'draft'
      ]);

      if (hasVitals(data)) {
        const bmi = calcBMI(data.weight_kg, data.height_cm);
        await client.query(`
          INSERT INTO vitals (
            consultation_id, weight_kg, height_cm, bmi,
            bp_systolic, bp_diastolic, pulse_bpm, temp_celsius, o2_sat_pct
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [
          consult.id,
          data.weight_kg   || null,
          data.height_cm   || null,
          bmi,
          data.bp_systolic || null,
          data.bp_diastolic|| null,
          data.pulse_bpm   || null,
          data.temp_celsius|| null,
          data.o2_sat_pct  || null
        ]);
      }

      await client.query('COMMIT');
      return this.getById(consult.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sets = [];
      const vals = [];
      let idx = 1;
      for (const f of CONSULT_FIELDS) {
        if (data[f] !== undefined) {
          sets.push(`${f} = $${idx++}`);
          vals.push(data[f] === '' ? null : data[f]);
        }
      }
      if (sets.length > 0) {
        sets.push('updated_at = NOW()');
        vals.push(id);
        await client.query(
          `UPDATE consultations SET ${sets.join(', ')} WHERE id = $${idx}`,
          vals
        );
      }

      if (hasVitals(data)) {
        const bmi = calcBMI(data.weight_kg, data.height_cm);
        const { rows } = await client.query(
          'SELECT id FROM vitals WHERE consultation_id = $1', [id]
        );
        const vParams = [
          data.weight_kg   ?? null,
          data.height_cm   ?? null,
          bmi,
          data.bp_systolic ?? null,
          data.bp_diastolic?? null,
          data.pulse_bpm   ?? null,
          data.temp_celsius?? null,
          data.o2_sat_pct  ?? null
        ];

        if (rows.length > 0) {
          await client.query(`
            UPDATE vitals SET
              weight_kg=$1, height_cm=$2, bmi=$3, bp_systolic=$4,
              bp_diastolic=$5, pulse_bpm=$6, temp_celsius=$7, o2_sat_pct=$8
            WHERE consultation_id=$9
          `, [...vParams, id]);
        } else {
          await client.query(`
            INSERT INTO vitals (
              consultation_id, weight_kg, height_cm, bmi,
              bp_systolic, bp_diastolic, pulse_bpm, temp_celsius, o2_sat_pct
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `, [id, ...vParams]);
        }
      }

      await client.query('COMMIT');
      return this.getById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async markComplete(id) {
    const { rows } = await pool.query(
      `UPDATE consultations SET status='complete', updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [id]
    );
    return rows[0];
  },

  async delete(id) {
    // Vitals are deleted via CASCADE on consultation FK
    await pool.query('DELETE FROM consultations WHERE id=$1', [id]);
  }
};

module.exports = ConsultationService;
