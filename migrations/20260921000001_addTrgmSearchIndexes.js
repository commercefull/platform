/**
 * Add pg_trgm GIN indexes for ILIKE '%term%' substring search.
 *
 * The existing FTS indexes (idx_*_fts, to_tsvector GIN) only serve
 * `@@ to_tsquery` searches. The product catalog search uses ILIKE
 * substring matching, which needs trigram indexes instead.
 *
 * CREATE INDEX CONCURRENTLY cannot run inside a transaction, so this
 * migration opts out of knex's per-migration transaction.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.config = { transaction: false };

const TRGM_INDEXES = [
  // product — matches the ILIKE columns in ProductSearchService
  { table: 'product', name: 'idx_product_name_trgm', column: '"name"' },
  { table: 'product', name: 'idx_product_description_trgm', column: '"description"' },
  { table: 'product', name: 'idx_product_shortDescription_trgm', column: '"shortDescription"' },
  { table: 'product', name: 'idx_product_sku_trgm', column: '"sku"' },
  { table: 'product', name: 'idx_product_slug_trgm', column: '"slug"' },
  // productVariant — variant SKU/barcode search branch
  { table: 'productVariant', name: 'idx_productVariant_sku_trgm', column: '"sku"' },
  { table: 'productVariant', name: 'idx_productVariant_barcode_trgm', column: '"barcode"' },
];

exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  for (const { table, name, column } of TRGM_INDEXES) {
    await knex.raw(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "${name}" ON "${table}" USING GIN (${column} gin_trgm_ops)`);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  for (const { name } of TRGM_INDEXES) {
    await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`);
  }
};
