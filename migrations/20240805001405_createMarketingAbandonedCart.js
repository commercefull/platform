/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('marketingAbandonedCart', function (table) {
    table.uuid('marketingAbandonedCartId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('basketId').notNullable().references('basketId').inTable('basket').onDelete('CASCADE');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('email');
    table.string('firstName');
    table.string('status').defaultTo('abandoned').checkIn(['abandoned', 'reminded', 'recovered', 'expired', 'opted_out']);
    table.decimal('cartValue', 15, 2);
    table.string('currency').defaultTo('USD');
    table.integer('itemCount').defaultTo(0);
    table.jsonb('cartSnapshot');
    table.timestamp('abandonedAt').notNullable();
    table.integer('emailSequence').defaultTo(0);
    table.integer('emailsSent').defaultTo(0);
    table.timestamp('lastEmailSentAt');
    table.timestamp('nextEmailScheduledAt');
    table.uuid('recoveredOrderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.timestamp('recoveredAt');
    table.decimal('recoveredValue', 15, 2);
    table.string('recoverySource');
    table.string('discountCode');
    table.decimal('discountAmount', 15, 2);
    table.boolean('optedOut').defaultTo(false);
    table.timestamp('optedOutAt');
    table.string('ipAddress');
    table.string('userAgent');
    table.string('deviceType');
    table.string('country');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('basketId');
    table.index('customerId');
    table.index('email');
    table.index('status');
    table.index('abandonedAt');
    table.index('nextEmailScheduledAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('marketingAbandonedCart');
};
