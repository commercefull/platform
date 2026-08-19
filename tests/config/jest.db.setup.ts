import path from 'node:path';
import axios from 'axios';
import dotenv from 'dotenv';
import {
  createDatabase,
  dropDatabase,
  getDbConfig,
  restoreSnapshot,
  type DbConfig,
} from './snapshot';
import { generateUUID } from '../../libs/uuid';
import { closeAllTestPools } from '../../libs/db/pool';

dotenv.config({ path: './.env' });

const SNAPSHOT_DIR = path.resolve(process.cwd(), './.cache/postgres');

jest.setTimeout(60000);

interface TestDbGlobal {
  testDatabaseName?: string;
}

declare global {
   
  var __testDb: TestDbGlobal | undefined;
}

beforeAll(async () => {
  const baseConfig = getDbConfig();
  const snapshotDbName = `${baseConfig.database}_snapshot`;
  const dumpFile = path.join(SNAPSHOT_DIR, `${snapshotDbName}.dump`);

  // Generate a unique DB name for this test file
  const testDbName = `test_${baseConfig.database}_${generateUUID().replace(/-/g, '').slice(0, 12)}`;
  const testConfig: DbConfig = { ...baseConfig, database: testDbName };

  console.log(`[Test Setup] Creating isolated test DB '${testDbName}'...`);

  try {
    // Create a fresh database for this test file
    await createDatabase(baseConfig, testDbName);

    // Restore the snapshot into it
    await restoreSnapshot(testConfig, dumpFile);

    // Expose the DB name globally so test utils can send it as a header
    global.__testDb = { testDatabaseName: testDbName };

    // Set global axios default so all axios.create() instances inherit the header
    axios.defaults.headers.common['X-Test-Database'] = testDbName;

    console.log(`[Test Setup] Isolated test DB '${testDbName}' ready.`);
  } catch (error) {
    console.error('[Test Setup] Failed to create isolated test DB:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  const baseConfig = getDbConfig();
  const testDbName = global.__testDb?.testDatabaseName;

  if (testDbName) {
    console.log(`[Test Teardown] Dropping isolated test DB '${testDbName}'...`);
    try {
      // Close all test DB pools first to release connections
      await closeAllTestPools();
      // Brief delay to let the server's pool connections settle
      await new Promise((resolve) => setTimeout(resolve, 500));
      await dropDatabase(baseConfig, testDbName);
      console.log(`[Test Teardown] Dropped '${testDbName}'.`);
    } catch (error) {
      console.error(`[Test Teardown] Failed to drop '${testDbName}':`, error);
    }
    global.__testDb = undefined;
    delete axios.defaults.headers.common['X-Test-Database'];
  }
}, 60000);
