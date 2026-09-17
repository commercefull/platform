/**
 * Migration Test Data Seed
 * Seeds import jobs in each lifecycle state plus an unresolved import
 * error for migrationOps integration tests.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';

const JOB_IDS = {
  PENDING_START: '01940000-0000-7000-8000-000000000001',
  RUNNING_PAUSE: '01940000-0000-7000-8000-000000000002',
  PAUSED_RESUME: '01940000-0000-7000-8000-000000000003',
  PENDING_FAIL: '01940000-0000-7000-8000-000000000004',
  PENDING_CANCEL: '01940000-0000-7000-8000-000000000005',
  MAPPINGS: '01940000-0000-7000-8000-000000000006',
};

const ERROR_ID = '01940001-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  const hasJob = await knex.schema.hasTable('importJob');
  if (!hasJob) {
    return;
  }

  const now = new Date();
  const startedAt = new Date(now.getTime() - 60000);

  const hasError = await knex.schema.hasTable('importError');
  if (hasError) {
    await knex('importError').where('importErrorId', ERROR_ID).del();
  }
  await knex('importJob').whereIn('importJobId', Object.values(JOB_IDS)).del();

  const baseJob = {
    organizationId: ORGANIZATION_ID,
    jobType: 'products',
    source: 'csv',
    stats: JSON.stringify({ totalRecords: 0, processedRecords: 0, successCount: 0, errorCount: 0, skippedCount: 0 }),
    dryRun: true,
    autoActivate: false,
    createdAt: now,
    updatedAt: now,
  };

  await knex('importJob').insert([
    { ...baseJob, importJobId: JOB_IDS.PENDING_START, status: 'pending' },
    { ...baseJob, importJobId: JOB_IDS.RUNNING_PAUSE, status: 'running', startedAt },
    { ...baseJob, importJobId: JOB_IDS.PAUSED_RESUME, status: 'paused', startedAt },
    { ...baseJob, importJobId: JOB_IDS.PENDING_FAIL, status: 'pending' },
    { ...baseJob, importJobId: JOB_IDS.PENDING_CANCEL, status: 'pending' },
    { ...baseJob, importJobId: JOB_IDS.MAPPINGS, status: 'pending' },
  ]);

  if (hasError) {
    await knex('importError').insert({
      importErrorId: ERROR_ID,
      importJobId: JOB_IDS.MAPPINGS,
      entityType: 'product',
      sourceId: 'src-err-001',
      severity: 'error',
      message: 'Seeded import error for resolve ops test',
      createdAt: now,
    });
  }
};
