/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationProcessedOrder');
  if (hasTable) return;

  await knex.schema.createTable('recommendationProcessedOrder', t => {
    // Natural PK: the order's own id — no uuidv7() default (dedupe ledger).
    t.uuid('orderId').primary();
    // Nullable: unscoped orders (lines without an organization) are
    // recorded as 'skipped' in this dedupe ledger.
    t.uuid('organizationId').nullable();
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('SET NULL');
    t.specificType('productIds', 'uuid[]').notNullable();
    t.string('status', 20).notNullable().defaultTo('counted'); // counted | reversed | skipped
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'status'], 'idx_recoProcessedOrder_org_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationProcessedOrder');
};
