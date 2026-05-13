const pool = require('../db/pool');

function buildPatientNumber(seq) {
  const year = new Date().getFullYear();
  return `P-${year}-${String(seq).padStart(5, '0')}`;
}

const SELECT_COLS = `
  id, patient_number, full_name, full_name_en, dob, gender,
  phone, phone_alt, address, blood_type, allergies, chronic_conditions, notes,
  created_by, created_at, updated_at,
  EXTRACT(YEAR FROM AGE(dob))::int AS age
`;

const PatientService = {

  async search({ query = '', limit = 20, offset = 0 }) {
    const q = query.trim();

    if (!q) {
      const [data, count] = await Promise.all([
        pool.query(
          `SELECT ${SELECT_COLS} FROM patients ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        ),
        pool.query('SELECT COUNT(*)::int AS total FROM patients')
      ]);
      return { data: data.rows, total: count.rows[0].total };
    }

    const likeQ      = `%${q}%`;
    const digitsOnly = q.replace(/\D/g, '');
    // Pass null when query has no digits so the $3 IS NOT NULL guard skips phone matching.
    // An empty digit string would become "%%" and match every phone number.
    const phoneQ     = digitsOnly.length > 0 ? `%${digitsOnly}%` : null;

    const searchSQL = `
      SELECT ${SELECT_COLS}
      FROM patients
      WHERE
        full_name ILIKE $2
        OR full_name_en ILIKE $2
        OR patient_number ILIKE $2
        OR ($3::text IS NOT NULL AND phone IS NOT NULL AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE $3)
        OR to_tsvector('simple', full_name) @@ plainto_tsquery('simple', $1)
        OR (full_name_en IS NOT NULL
            AND to_tsvector('simple', full_name_en) @@ plainto_tsquery('simple', $1))
      ORDER BY
        CASE WHEN patient_number ILIKE $2 THEN 0
             WHEN full_name ILIKE $2      THEN 1
             ELSE 2
        END,
        full_name
      LIMIT $4 OFFSET $5
    `;

    const countSQL = `
      SELECT COUNT(*)::int AS total
      FROM patients
      WHERE
        full_name ILIKE $2
        OR full_name_en ILIKE $2
        OR patient_number ILIKE $2
        OR ($3::text IS NOT NULL AND phone IS NOT NULL AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE $3)
        OR to_tsvector('simple', full_name) @@ plainto_tsquery('simple', $1)
        OR (full_name_en IS NOT NULL
            AND to_tsvector('simple', full_name_en) @@ plainto_tsquery('simple', $1))
    `;

    const [data, count] = await Promise.all([
      pool.query(searchSQL, [q, likeQ, phoneQ, limit, offset]),
      pool.query(countSQL,  [q, likeQ, phoneQ])
    ]);

    return { data: data.rows, total: count.rows[0].total };
  },

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT
         p.id, p.patient_number, p.full_name, p.full_name_en, p.dob, p.gender,
         p.phone, p.phone_alt, p.address, p.blood_type,
         p.allergies, p.chronic_conditions, p.notes,
         p.created_by, p.created_at, p.updated_at,
         EXTRACT(YEAR FROM AGE(p.dob))::int AS age,
         u.name AS created_by_name
       FROM patients p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: [{ seq }] } = await client.query(
        "SELECT nextval('patient_number_seq') AS seq"
      );
      const patient_number = buildPatientNumber(seq);

      const { rows } = await client.query(
        `INSERT INTO patients (
           patient_number, full_name, full_name_en, dob, gender,
           phone, phone_alt, address, blood_type,
           allergies, chronic_conditions, notes, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *,
           EXTRACT(YEAR FROM AGE(dob))::int AS age`,
        [
          patient_number,
          data.full_name.trim(),
          data.full_name_en?.trim() || null,
          data.dob       || null,
          data.gender    || null,
          data.phone?.trim()     || null,
          data.phone_alt?.trim() || null,
          data.address?.trim()   || null,
          data.blood_type        || null,
          data.allergies          || [],
          data.chronic_conditions || [],
          data.notes?.trim()     || null,
          data.created_by
        ]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id, data) {
    const ALLOWED = [
      'full_name', 'full_name_en', 'dob', 'gender',
      'phone', 'phone_alt', 'address', 'blood_type',
      'allergies', 'chronic_conditions', 'notes'
    ];

    const setClauses = [];
    const values     = [];
    let   idx        = 1;

    for (const field of ALLOWED) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`);
        values.push(data[field]);
      }
    }

    if (setClauses.length === 0) return this.getById(id);

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE patients SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *, EXTRACT(YEAR FROM AGE(dob))::int AS age`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM patients WHERE id = $1', [id]);
  },

  async getStats() {
    const { rows: [stats] } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM patients)                               AS total_patients,
        (SELECT COUNT(*)::int FROM patients
         WHERE created_at::date = CURRENT_DATE)                           AS new_today,
        (SELECT COUNT(*)::int FROM appointments
         WHERE scheduled_at::date = CURRENT_DATE
           AND status NOT IN ('cancelled','no_show'))                     AS today_appointments,
        (SELECT COUNT(*)::int FROM appointments
         WHERE scheduled_at::date = CURRENT_DATE
           AND status IN ('arrived','in_progress'))                       AS waiting
    `);
    return stats;
  }
};

module.exports = PatientService;
