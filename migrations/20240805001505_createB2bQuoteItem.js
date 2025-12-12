/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('b2bQuoteItem', function(table) {
    table.uuid('b2bQuoteItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bQuoteId').notNullable().references('b2bQuoteId').inTable('b2bQuote').onDelete('CASCADE');
    table.uuid('productId').references('productId').inTable('product').onDelete('SET NULL');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('SET NULL');
    table.string('sku');
    table.string('name').notNullable();
    table.text('description');
    table.integer('quantity').notNullable().defaultTo(1);
    table.string('unit').defaultTo('each');
    table.decimal('listPrice', 15, 2);
    table.decimal('unitPrice', 15, 2).notNullable();
    table.decimal('costPrice', 15, 2);
    table.decimal('discountPercent', 5, 2).defaultTo(0);
    table.decimal('discountAmount', 15, 2).defaultTo(0);
    table.decimal('lineTotal', 15, 2).notNullable();
    table.decimal('taxRate', 5, 2).defaultTo(0);
    table.decimal('taxAmount', 15, 2).defaultTo(0);
    table.decimal('margin', 15, 2);
    table.decimal('marginPercent', 5, 2);
    table.boolean('isCustomItem').defaultTo(false);
    table.boolean('isPriceOverride').defaultTo(false);
    table.string('priceOverrideReason');
    table.integer('position').defaultTo(0);
    table.text('notes');
    table.date('requestedDeliveryDate');
    table.integer('leadTimeDays');
    table.jsonb('customFields');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('b2bQuoteId');
    table.index('productId');
    table.index('productVariantId');
    table.index('sku');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('b2bQuoteItem');
};
