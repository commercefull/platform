/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationProcessedOrder');
  if (hasTable) return;

  await knex.schema.createTable('recommendationProcessedOrder', t => {
    // Natural PK: the order's own id — no uuidv7() default (dedupe ledger).
    t.uuid('orderId').primary();
    t.uuid('organizationId').notNullable();
    t.uuid('storeId').nullable();
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
