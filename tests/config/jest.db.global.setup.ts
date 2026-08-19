import path from 'node:path';
import dotenv from 'dotenv';
import {
  createDatabase,
  createSnapshot,
  dropDatabase,
  getDbConfig,
  runMigrations,
  runSeeds,
  type DbConfig,
} from './snapshot';

dotenv.config({ path: './.env' });

const SNAPSHOT_DIR = path.resolve(process.cwd(), './.cache/postgres');
const SNAPSHOT_DB_SUFFIX = '_snapshot';

export default async function globalSetup(): Promise<void> {
  console.log('\n[Global Setup] Starting database snapshot creation...');

  const baseConfig = getDbConfig();
  const snapshotDbName = `${baseConfig.database}${SNAPSHOT_DB_SUFFIX}`;
  const snapshotConfig: DbConfig = { ...baseConfig, database: snapshotDbName };

  try {
    // Drop any leftover snapshot database
    await dropDatabase(baseConfig, snapshotDbName);

    // Create a fresh snapshot database
    await createDatabase(baseConfig, snapshotDbName);

    // Run migrations on the snapshot database
    await runMigrations(snapshotConfig);

    // Run seeds on the snapshot database
    await runSeeds(snapshotConfig);

    // Create a pg_dump snapshot file
    await createSnapshot(snapshotConfig, SNAPSHOT_DIR);

    // Drop the snapshot database (we only need the dump file)
    await dropDatabase(baseConfig, snapshotDbName);

    console.log(`[Global Setup] Snapshot created at ${SNAPSHOT_DIR}/${snapshotDbName}.dump\n`);
  } catch (error) {
    console.error('[Global Setup] Error:', error);
    throw error;
  }
}
