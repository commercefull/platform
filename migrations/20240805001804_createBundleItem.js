/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('bundleItem', function (table) {
    table.uuid('bundleItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('productBundleId').notNullable().references('productBundleId').inTable('productBundle').onDelete('CASCADE');
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('SET NULL');
    table.string('slotName'); // For customizable bundles: "Choose your drink", etc.
    table.integer('quantity').defaultTo(1);
    table.integer('minQuantity').defaultTo(1);
    table.integer('maxQuantity');
    table.boolean('isRequired').defaultTo(true);
    table.boolean('isDefault').defaultTo(false);
    table.decimal('priceAdjustment', 15, 2).defaultTo(0);
    table.decimal('discountPercent', 5, 2).defaultTo(0);
    table.integer('sortOrder').defaultTo(0);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('productBundleId');
    table.index('productId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('bundleItem');
};
