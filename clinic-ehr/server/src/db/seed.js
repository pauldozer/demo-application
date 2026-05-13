/**
 * Creates the default admin account if one doesn't exist yet.
 * Run once after first migration: npm run seed
 * DEFAULT CREDENTIALS: admin / Admin@1234  ← CHANGE ON FIRST LOGIN
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./pool');

async function seed() {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE username = 'admin'"
  );

  if (rows.length > 0) {
    console.log('Admin user already exists — skipping seed.');
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash('Admin@1234', 12);
  await pool.query(
    `INSERT INTO users (name, username, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    ['System Admin', 'admin', hash, 'admin']
  );

  console.log('');
  console.log('✓ Admin user created.');
  console.log('  Username : admin');
  console.log('  Password : Admin@1234');
  console.log('  ⚠️  Change this password immediately after first login!');
  console.log('');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
