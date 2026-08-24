/**
 * Migration Smoke Test
 *
 * Verifies that all migrations apply cleanly from scratch against a fresh
 * temporary database, and optionally with seeded data.
 *
 * Usage:
 *   node scripts/migration-smoke-test.js           # fresh DB only
 *   node scripts/migration-smoke-test.js --seeded   # fresh DB + seeds
 *
 * Requires: PostgreSQL running (uses POSTGRES_HOST/PORT/USER/PASSWORD env vars)
 */

require('dotenv').config({ path: './.env' });

const { knex } = require('knex');
const { spawnSync } = require('child_process');
const path = require('path');

const TEST_DB_NAME = `commercefull_smoke_${Date.now()}`;
const pgConfig = {
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

const adminKnex = knex({
  client: 'pg',
  connection: { ...pgConfig, database: 'postgres' },
});

async function run() {
  const seeded = process.argv.includes('--seeded');
  let exitCode = 0;

  try {
    // 1. Create temporary database
    console.log(`[smoke] Creating temporary database: ${TEST_DB_NAME}`);
    await adminKnex.raw(`CREATE DATABASE "${TEST_DB_NAME}"`);

    // 2. Run migrations
    console.log('[smoke] Running all migrations...');
    const migrateResult = spawnSync('npx', [
      'knex', 'migrate:latest',
      '--knexfile', 'knexfile.js',
    ], {
      env: {
        ...process.env,
        POSTGRES_DB: TEST_DB_NAME,
        DB_HOST: pgConfig.host,
        POSTGRES_PORT: String(pgConfig.port),
        POSTGRES_USER: pgConfig.user,
        POSTGRES_PASSWORD: pgConfig.password,
      },
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    if (migrateResult.status !== 0) {
      console.error('[smoke] Migration FAILED:');
      console.error(migrateResult.stdout);
      console.error(migrateResult.stderr);
      exitCode = 1;
      throw new Error('Migrations failed');
    }

    console.log('[smoke] Migrations applied successfully');
    if (migrateResult.stdout) console.log(migrateResult.stdout.trim());

    // 3. Verify all migrations are recorded
    const testKnex = knex({
      client: 'pg',
      connection: { ...pgConfig, database: TEST_DB_NAME },
    });

    const migrationRecords = await testKnex('knexMigrations').orderBy('id');
    console.log(`[smoke] ${migrationRecords.length} migrations recorded in knexMigrations table`);

    if (migrationRecords.length === 0) {
      console.error('[smoke] FAIL: No migrations recorded');
      exitCode = 1;
    }

    // 4. Verify tables exist by querying each one
    const tables = await testKnex.raw(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tableNames = tables.rows.map(r => r.tablename).filter(n => n !== 'knexMigrations');
    console.log(`[smoke] ${tableNames.length} tables found: ${tableNames.slice(0, 10).join(', ')}${tableNames.length > 10 ? '...' : ''}`);

    let tableErrors = 0;
    for (const tableName of tableNames) {
      try {
        await testKnex.raw(`SELECT COUNT(*) FROM "${tableName}"`);
      } catch (err) {
        console.error(`[smoke] FAIL: Cannot query table "${tableName}": ${err.message}`);
        tableErrors++;
      }
    }

    if (tableErrors > 0) {
      console.error(`[smoke] ${tableErrors} tables failed to query`);
      exitCode = 1;
    } else {
      console.log(`[smoke] All ${tableNames.length} tables queried successfully`);
    }

    // 5. Optionally run seeds
    if (seeded) {
      console.log('[smoke] Running seeds...');
      const seedResult = spawnSync('npx', [
        'knex', 'seed:run',
        '--knexfile', 'knexfile.js',
      ], {
        env: {
          ...process.env,
          POSTGRES_DB: TEST_DB_NAME,
          DB_HOST: pgConfig.host,
          POSTGRES_PORT: String(pgConfig.port),
          POSTGRES_USER: pgConfig.user,
          POSTGRES_PASSWORD: pgConfig.password,
        },
        stdio: 'pipe',
        encoding: 'utf-8',
        cwd: process.cwd(),
      });

      if (seedResult.status !== 0) {
        console.error('[smoke] Seed FAILED:');
        console.error(seedResult.stdout);
        console.error(seedResult.stderr);
        exitCode = 1;
      } else {
        console.log('[smoke] Seeds applied successfully');
      }
    }

    await testKnex.destroy();
  } catch (err) {
    console.error(`[smoke] ERROR: ${err.message}`);
    exitCode = 1;
  } finally {
    // 6. Drop temporary database
    try {
      console.log(`[smoke] Dropping temporary database: ${TEST_DB_NAME}`);
      await adminKnex.raw(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE)`);
    } catch (err) {
      console.error(`[smoke] Failed to drop test database: ${err.message}`);
    }

    await adminKnex.destroy();
  }

  if (exitCode === 0) {
    console.log('[smoke] ✅ All smoke tests passed');
  } else {
    console.log('[smoke] ❌ Smoke tests failed');
  }

  process.exit(exitCode);
}

run();
