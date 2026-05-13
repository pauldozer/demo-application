const path = require('path');
const fs   = require('fs');
const pool = require('../db/pool');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

const FileService = {

  async listForPatient(patientId) {
    const { rows } = await pool.query(`
      SELECT
        f.id, f.patient_id, f.consultation_id, f.file_type,
        f.category, f.original_name, f.file_size_bytes,
        f.mime_type, f.description, f.uploaded_at,
        f.storage_path,
        u.name AS uploaded_by_name,
        c.visit_date AS consultation_date
      FROM patient_files f
      JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN consultations c ON f.consultation_id = c.id
      WHERE f.patient_id = $1
      ORDER BY f.uploaded_at DESC
    `, [patientId]);
    return rows;
  },

  async getById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM patient_files WHERE id = $1', [id]
    );
    return rows[0] || null;
  },

  async create({ patientId, consultationId, uploadedBy, fileType, category,
                 originalName, storagePath, fileSizeBytes, mimeType, description }) {
    const { rows } = await pool.query(`
      INSERT INTO patient_files (
        patient_id, consultation_id, uploaded_by, file_type, category,
        original_name, storage_path, file_size_bytes, mime_type, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      patientId,
      consultationId || null,
      uploadedBy,
      fileType || 'other',
      category   || null,
      originalName,
      storagePath,
      fileSizeBytes || null,
      mimeType || null,
      description || null
    ]);
    return rows[0];
  },

  getFullPath(storagePath) {
    return path.join(DATA_DIR, storagePath);
  },

  async delete(id) {
    const file = await this.getById(id);
    if (!file) return null;

    // Remove from filesystem
    const fullPath = this.getFullPath(file.storage_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await pool.query('DELETE FROM patient_files WHERE id = $1', [id]);
    return file;
  }
};

module.exports = FileService;
