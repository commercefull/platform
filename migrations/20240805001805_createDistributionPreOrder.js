/**
 * Distribution Pre-Order Migration
 * Creates the distributionPreOrder table for pre-order management
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionPreOrder', function(table) {
    table.uuid('distributionPreOrderId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('SET NULL');
    table.string('status').defaultTo('active'); // active, paused, fulfilled, cancelled
    table.string('preOrderType').defaultTo('pre_order'); // pre_order, backorder, coming_soon
    table.timestamp('releaseDate');
    table.timestamp('estimatedShipDate');
    table.string('estimatedShipText'); // "Ships in 2-3 weeks"
    table.boolean('requiresDeposit').defaultTo(false);
    table.decimal('depositAmount', 15, 2);
    table.decimal('depositPercent', 5, 2);
    table.boolean('isDepositRefundable').defaultTo(true);
    table.integer('maxQuantity');
    table.integer('reservedQuantity').defaultTo(0);
    table.integer('orderedQuantity').defaultTo(0);
    table.boolean('allowOversell').defaultTo(false);
    table.integer('oversellLimit');
    table.decimal('preOrderPrice', 15, 2);
    table.decimal('regularPrice', 15, 2);
    table.decimal('discountPercent', 5, 2);
    table.string('currency', 3).defaultTo('USD');
    table.boolean('chargeOnRelease').defaultTo(false);
    table.boolean('notifyOnRelease').defaultTo(true);
    table.text('preOrderMessage');
    table.text('termsAndConditions');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('productId');
    table.index('productVariantId');
    table.index('status');
    table.index('releaseDate');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('distributionPreOrder');
};
