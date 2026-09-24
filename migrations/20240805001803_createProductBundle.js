/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productBundle', function (table) {
    table.uuid('productBundleId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('slug');
    table.text('description');
    table.string('bundleType').defaultTo('fixed'); // fixed, customizable, mix_and_match
    table.string('pricingType').defaultTo('fixed'); // fixed, calculated, percentage_discount
    table.bigInteger('fixedPriceCents');
    table.decimal('discountPercent', 5, 2);
    table.bigInteger('discountAmountCents');
    table.bigInteger('minPriceCents');
    table.bigInteger('maxPriceCents');
    table.string('currency', 3).defaultTo('USD');
    table.integer('minItems');
    table.integer('maxItems');
    table.integer('minQuantity').defaultTo(1);
    table.integer('maxQuantity');
    table.boolean('requireAllItems').defaultTo(true);
    table.boolean('allowDuplicates').defaultTo(false);
    table.boolean('showSavings').defaultTo(true);
    table.bigInteger('savingsAmountCents');
    table.decimal('savingsPercent', 5, 2);
    table.string('imageUrl');
    table.integer('sortOrder').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('startDate');
    table.timestamp('endDate');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique('productId');
    table.index('bundleType');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('productBundle');
};
