/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('priceAlert', function(table) {
    table.uuid('priceAlertId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('CASCADE');
    table.string('email');
    table.string('phone');
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    table.string('productName');
    table.string('variantName');
    table.string('sku');
    table.string('status').defaultTo('active'); // active, notified, purchased, cancelled, expired
    table.string('alertType').defaultTo('target'); // target, any_drop, percentage_drop
    table.decimal('targetPrice', 15, 2);
    table.decimal('percentageDrop', 5, 2);
    table.decimal('originalPrice', 15, 2);
    table.decimal('currentPrice', 15, 2);
    table.string('currency', 3).defaultTo('USD');
    table.string('notificationChannel').defaultTo('email'); // email, sms, push, all
    table.timestamp('notifiedAt');
    table.decimal('notifiedPrice', 15, 2);
    table.integer('notificationCount').defaultTo(0);
    table.timestamp('lastNotifiedAt');
    table.timestamp('purchasedAt');
    table.uuid('purchaseOrderId');
    table.timestamp('expiresAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['productId', 'status']);
    table.index(['productVariantId', 'status']);
    table.index('customerId');
    table.index('email');
    table.index('targetPrice');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('priceAlert');
};
