const fs   = require('fs');
const path = require('path');
const pool = require('./pool');

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          SERIAL      PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_migration_filename UNIQUE (filename)
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) continue;

      console.log(`  Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      ran++;
    }

    if (ran === 0) console.log('  Database schema is up to date.');
    else console.log(`  ${ran} migration(s) applied.`);
  } finally {
    client.release();
  }
}

module.exports = runMigrations;
