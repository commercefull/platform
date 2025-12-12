/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('stockAlert', function(table) {
    table.uuid('stockAlertId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('CASCADE');
    table.string('email');
    table.string('phone');
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    table.string('productName');
    table.string('variantName');
    table.string('sku');
    table.string('status').defaultTo('active'); // active, notified, purchased, cancelled, expired
    table.integer('desiredQuantity').defaultTo(1);
    table.integer('stockThreshold').defaultTo(1);
    table.boolean('notifyOnAnyStock').defaultTo(true);
    table.string('notificationChannel').defaultTo('email'); // email, sms, push, all
    table.timestamp('notifiedAt');
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
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stockAlert');
};
