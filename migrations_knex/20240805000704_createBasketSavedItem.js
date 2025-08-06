/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('basketSavedItem', t => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('customerId').references('id').inTable('customer');
      t.string('sessionId', 255);
      t.uuid('productId').notNullable();
      t.uuid('variantId');
      t.string('addedFrom', 50);
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.index('customerId');
      t.index('sessionId');
      t.index('productId');
      t.index('variantId');
    })
    .then(() => knex.schema.raw('CREATE UNIQUE INDEX basket_saved_item_customer_unique_idx ON "basketSavedItem" ("customerId", "productId", "variantId") NULLS NOT DISTINCT WHERE "customerId" IS NOT NULL'))
    .then(() => knex.schema.raw('CREATE UNIQUE INDEX basket_saved_item_session_unique_idx ON "basketSavedItem" ("sessionId", "productId", "variantId") NULLS NOT DISTINCT WHERE "sessionId" IS NOT NULL AND "customerId" IS NULL'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketSavedItem');
};
