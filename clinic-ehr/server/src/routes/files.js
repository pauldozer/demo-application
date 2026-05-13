const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const { verifyToken }  = require('../middleware/auth');
const { requireRole }  = require('../middleware/roles');
const { auditLog }     = require('../middleware/audit');
const FileService      = require('../services/file.service');

const router  = express.Router();
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

const ALLOWED_EXTS = new Set(['.pdf','.jpg','.jpeg','.png','.tiff','.tif','.gif','.bmp','.webp']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const patientId = req.body.patient_id;
    if (!patientId) return cb(new Error('patient_id required'));
    const now   = new Date();
    const year  = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir   = path.join(DATA_DIR, 'patients', patientId, year, month);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.has(ext)) return cb(null, true);
    cb(new Error(`File type not allowed. Allowed: ${[...ALLOWED_EXTS].join(', ')}`));
  }
});

router.use(verifyToken);

// ── POST /api/files/upload ──────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { patient_id, consultation_id, file_type, category, description } = req.body;

  // Build storage_path relative to DATA_DIR for portability
  const storagePath = path.relative(DATA_DIR, req.file.path);

  try {
    const record = await FileService.create({
      patientId:      patient_id,
      consultationId: consultation_id || null,
      uploadedBy:     req.user.id,
      fileType:       file_type || 'other',
      category:       category  || null,
      originalName:   req.file.originalname,
      storagePath,
      fileSizeBytes:  req.file.size,
      mimeType:       req.file.mimetype,
      description:    description || null
    });

    await auditLog({
      userId: req.user.id, action: 'upload_file',
      entityType: 'patient_file', entityId: record.id,
      newValues: { patient_id, original_name: req.file.originalname },
      ipAddress: req.ip
    });

    return res.status(201).json(record);
  } catch (err) {
    // Clean up uploaded file if DB write fails
    fs.unlink(req.file.path, () => {});
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// ── GET /api/files/:id/download ─────────────────────────
router.get('/:id/download', async (req, res) => {
  try {
    const file = await FileService.getById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const fullPath = FileService.getFullPath(file.storage_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    await auditLog({
      userId: req.user.id, action: 'download_file',
      entityType: 'patient_file', entityId: file.id,
      ipAddress: req.ip
    });

    const inline = ['.pdf','.jpg','.jpeg','.png','.gif','.webp'].includes(
      path.extname(file.original_name).toLowerCase()
    );

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.original_name)}"`
    );

    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/files/:id ───────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const file = await FileService.getById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Assistants cannot delete
    if (req.user.role === 'assistant') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await FileService.delete(req.params.id);

    await auditLog({
      userId: req.user.id, action: 'delete_file',
      entityType: 'patient_file', entityId: req.params.id,
      oldValues: { original_name: file.original_name },
      ipAddress: req.ip
    });

    return res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
