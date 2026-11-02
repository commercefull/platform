/**
 * Seed Tracking Config Test Data
 * Creates disabled tracking configs for seeded test stores so domain events do
 * not produce TrackingConfigNotFoundError noise during integration tests.
 * status='disabled' makes ProcessTrackingEventUseCase return early
 * (skipped: ['tracking_disabled']) before any provider send or mapping lookup.
 *
 * Store IDs mirror:
 *  - 20241220000022_seedStoreTestData.js          (20000000-...)
 *  - 20260913100000_seedMultiStoreData.js         (30000000-0000-...)
 *  - 20261002110000_seedEnterpriseRegionalCommerce.js (41000000-...)
 */

const tableName = 'trackingConfig';

// Reference organization ID from organization seed
const TEST_ORG_ID = '01911000-0000-7000-8000-000000000001';

const TEST_STORES = [
  // seedStoreTestData
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
  // seedMultiStoreData
  '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002',
  // seedEnterpriseRegionalCommerce
  '41000000-0000-7000-8000-000000000001',
  '41000000-0000-7000-8000-000000000002',
  '41000000-0000-7000-8000-000000000003',
  '41000000-0000-7000-8000-000000000004',
  '41000000-0000-7000-8000-000000000005',
  '41000000-0000-7000-8000-000000000006',
];

const configId = index => `27000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`;

exports.seed = async function (knex) {
  await knex(tableName).whereIn('storeId', TEST_STORES).del();

  const rows = TEST_STORES.map((storeId, index) => ({
    configId: configId(index),
    storeId,
    organizationId: TEST_ORG_ID,
    status: 'disabled',
    eventMappings: JSON.stringify([]),
  }));

  await knex(tableName).insert(rows);
};
