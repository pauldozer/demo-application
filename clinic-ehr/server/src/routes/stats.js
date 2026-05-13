const express = require('express');
const { verifyToken } = require('../middleware/auth');
const PatientService  = require('../services/patient.service');

const router = express.Router();
router.use(verifyToken);

// ── GET /api/stats/overview ─────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const stats = await PatientService.getStats();
    return res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
