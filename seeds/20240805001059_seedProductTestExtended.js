/**
 * Seed extended product test data for integration tests
 *
 * Depends on:
 *   - 20240805001058_seedProductTestData.js  (products, variants)
 *   - 20240805001060_seedDynamicAttributeTestData.js  (attributes, product types)
 *   - 20240805001017_seedProductCategory.js  (categories)
 *
 * Provides:
 *   - SEEDED_CATEGORY_ELECTRONICS_ID  — electronics category with product 1 & 2 mapped
 *   - SEEDED_CATEGORY_FASHION_ID      — fashion category with product 2 mapped
 *   - SEEDED_REVIEW_1_ID              — approved review on product 1 (for customer review tests)
 *   - SEEDED_QA_1_ID                  — approved Q&A on product 1 (for customer Q&A tests)
 *   - SEEDED_BUNDLE_1_ID              — active bundle containing product 1 (for bundle tests)
 *   - SEEDED_COLLECTION_1_ID          — active collection containing product 1 (for collection tests)
 *
 * @param { import('knex').Knex } knex
 */

const TEST_PRODUCT_1_ID = '10000000-0000-0000-0000-000000000001';
const TEST_PRODUCT_2_ID = '10000000-0000-0000-0000-000000000002';

const SEEDED_REVIEW_1_ID    = 'a0000000-0000-0000-0000-000000000001';
const SEEDED_QA_1_ID        = 'b0000000-0000-0000-0000-000000000001';
const SEEDED_BUNDLE_1_ID    = 'c0000000-0000-0000-0000-000000000001';
const SEEDED_COLLECTION_1_ID = 'd0000000-0000-0000-0000-000000000001';

exports.seed = async function (knex) {
  // ── Guard: products must exist ──────────────────────────────────────────
  const products = await knex('product')
    .whereIn('productId', [TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID])
    .select('productId');

  if (products.length === 0) {
    console.warn('[seed] seedProductTestExtended: test products not found, skipping');
    return;
  }

  // ── Clean up previous run ───────────────────────────────────────────────
  await knex('productCollectionMap').where('productCollectionId', SEEDED_COLLECTION_1_ID).delete().catch(() => {});
  await knex('productCollection').where('productCollectionId', SEEDED_COLLECTION_1_ID).delete().catch(() => {});
  await knex('bundleItem').where('productBundleId', SEEDED_BUNDLE_1_ID).delete().catch(() => {});
  await knex('productBundle').where('productBundleId', SEEDED_BUNDLE_1_ID).delete().catch(() => {});
  await knex('productQa').where('productQaId', SEEDED_QA_1_ID).delete().catch(() => {});
  await knex('productReview').where('productReviewId', SEEDED_REVIEW_1_ID).delete().catch(() => {});

  // ── Approved review on product 1 ────────────────────────────────────────
  // Required by: reviewsQa.test.ts (customer get reviews — only approved shown)
  await knex('productReview').insert({
    productReviewId: SEEDED_REVIEW_1_ID,
    productId: TEST_PRODUCT_1_ID,
    customerId: null,
    rating: 5,
    title: 'Excellent product',
    content: 'Really happy with this purchase. Highly recommended.',
    reviewerName: 'Seed Reviewer',
    reviewerEmail: 'seed@example.com',
    status: 'approved',
    isVerifiedPurchase: false,
    helpfulCount: 3,
    reportCount: 0,
  }).onConflict('productReviewId').merge();

  // ── Approved Q&A on product 1 ────────────────────────────────────────────
  // Required by: reviewsQa.test.ts (customer list Q&A — only approved shown)
  await knex('productQa').insert({
    productQaId: SEEDED_QA_1_ID,
    productId: TEST_PRODUCT_1_ID,
    customerId: null,
    question: 'Does this come with a warranty?',
    status: 'answered',
    askerName: 'Seed Asker',
    askerEmail: 'asker@example.com',
  }).onConflict('productQaId').merge();

  // ── Active bundle containing product 1 ──────────────────────────────────
  // Required by: bundle.test.ts (customer list active bundles)
  await knex('productBundle').insert({
    productBundleId: SEEDED_BUNDLE_1_ID,
    productId: TEST_PRODUCT_1_ID,
    name: 'Seed Test Bundle',
    bundleType: 'fixed',
    pricingType: 'percentage_discount',
    discountPercent: 10,
    isActive: true,
  }).onConflict('productBundleId').merge();

  await knex('bundleItem').insert({
    productBundleId: SEEDED_BUNDLE_1_ID,
    productId: TEST_PRODUCT_2_ID,
    quantity: 1,
    isRequired: true,
    sortOrder: 0,
  }).onConflict().ignore();

  // ── Active collection containing product 1 ──────────────────────────────
  // Required by: collection.test.ts (list collections)
  await knex('productCollection').insert({
    productCollectionId: SEEDED_COLLECTION_1_ID,
    name: 'Seed Test Collection',
    slug: 'seed-test-collection',
    description: 'Seeded collection for integration tests',
    isActive: true,
  }).onConflict('productCollectionId').merge();

  await knex('productCollectionMap').insert({
    productCollectionId: SEEDED_COLLECTION_1_ID,
    productId: TEST_PRODUCT_1_ID,
    position: 0,
  }).onConflict().ignore();
};

exports.down = async function (knex) {
  await knex('productCollectionMap').where('productCollectionId', SEEDED_COLLECTION_1_ID).delete().catch(() => {});
  await knex('productCollection').where('productCollectionId', SEEDED_COLLECTION_1_ID).delete().catch(() => {});
  await knex('bundleItem').where('productBundleId', SEEDED_BUNDLE_1_ID).delete().catch(() => {});
  await knex('productBundle').where('productBundleId', SEEDED_BUNDLE_1_ID).delete().catch(() => {});
  await knex('productQa').where('productQaId', SEEDED_QA_1_ID).delete().catch(() => {});
  await knex('productReview').where('productReviewId', SEEDED_REVIEW_1_ID).delete().catch(() => {});
};

// Export IDs so tests can reference them directly if needed
module.exports.SEEDED_REVIEW_1_ID     = SEEDED_REVIEW_1_ID;
module.exports.SEEDED_QA_1_ID         = SEEDED_QA_1_ID;
module.exports.SEEDED_BUNDLE_1_ID     = SEEDED_BUNDLE_1_ID;
module.exports.SEEDED_COLLECTION_1_ID = SEEDED_COLLECTION_1_ID;
