/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('basketSavedItem', t => {
      t.uuid('basketSavedItemId').primary().defaultTo(knex.raw('uuidv7()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('customerId').references('customerId').inTable('customer');
      t.string('sessionId', 255);
      t.uuid('productId').notNullable().references('productId').inTable('product');
      t.uuid('productVariantId').references('productVariantId').inTable('productVariant');
      t.string('addedFrom', 50);

      t.index('customerId');
      t.index('sessionId');
      t.index('productId');
      t.index('productVariantId');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketSavedItem');
};
