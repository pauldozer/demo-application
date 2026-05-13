require('dotenv').config();

const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const path         = require('path');
const fs           = require('fs');

const runMigrations = require('./db/migrate');
const authRoutes          = require('./routes/auth');
const patientRoutes       = require('./routes/patients');
const userRoutes          = require('./routes/users');
const statsRoutes         = require('./routes/stats');
const consultationRoutes  = require('./routes/consultations');
const prescriptionRoutes  = require('./routes/prescriptions');
const medicationRoutes    = require('./routes/medications');
const fileRoutes          = require('./routes/files');

// ── Ensure data directories exist ──────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(path.join(DATA_DIR, 'patients'), { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'backups', 'db'),    { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'backups', 'files'), { recursive: true });

// ── Express setup ───────────────────────────────────────
const app    = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true }
});

app.use(helmet({ contentSecurityPolicy: false })); // CSP handled by Vite in dev
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medications',   medicationRoutes);
app.use('/api/files',         fileRoutes);

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
});

// ── 404 fallback for API ────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Socket.io ───────────────────────────────────────────
io.on('connection', (socket) => {
  const { doctorId, role } = socket.handshake.auth;

  if (doctorId) socket.join(`doctor:${doctorId}`);
  if (role === 'assistant' || role === 'admin') socket.join('front_desk');

  socket.on('appointment:check_in', ({ appointmentId }) => {
    io.emit('appointment:updated', { appointmentId, status: 'arrived' });
    io.emit('patient:arrived', { appointmentId });
  });

  socket.on('appointment:status_change', ({ appointmentId, status }) => {
    io.emit('appointment:updated', { appointmentId, status });
  });

  socket.on('disconnect', () => {
    // Socket.io cleans up rooms automatically
  });
});

// ── Start ───────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001');

async function start() {
  console.log('');
  console.log('  Clinic EHR Server v1.0.0');
  console.log('  ─────────────────────────');

  try {
    console.log('  Running database migrations...');
    await runMigrations();
  } catch (err) {
    console.error('  ✗ Migration failed:', err.message);
    console.error('    Check your .env database settings and ensure PostgreSQL is running.');
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`  ✓ Server listening on http://0.0.0.0:${PORT}`);
    console.log(`  ✓ Client expected at ${CLIENT_URL}`);
    console.log(`  ✓ Data directory: ${DATA_DIR}`);
    console.log('');
  });
}

start();

module.exports = { app, io };
