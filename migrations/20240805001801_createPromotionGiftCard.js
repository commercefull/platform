/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('promotionGiftCard', function (table) {
    table.uuid('promotionGiftCardId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('code').unique().notNullable();
    table.string('type').defaultTo('standard'); // standard, promotional, reward, refund
    table.bigInteger('initialBalanceCents').notNullable();
    table.bigInteger('currentBalanceCents').notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.string('status').defaultTo('active'); // pending, active, depleted, expired, cancelled, suspended
    table.uuid('purchasedBy').references('customerId').inTable('customer').onDelete('SET NULL');
    table.uuid('purchaseOrderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.string('recipientEmail');
    table.string('recipientName');
    table.text('personalMessage');
    table.timestamp('deliveryDate');
    table.boolean('isDelivered').defaultTo(false);
    table.timestamp('deliveredAt');
    table.string('deliveryMethod').defaultTo('email'); // email, sms, print, physical
    table.uuid('assignedTo').references('customerId').inTable('customer').onDelete('SET NULL');
    table.timestamp('assignedAt');
    table.timestamp('activatedAt');
    table.timestamp('expiresAt');
    table.timestamp('lastUsedAt');
    table.integer('usageCount').defaultTo(0);
    table.bigInteger('totalRedeemedCents').defaultTo(0);
    table.boolean('isReloadable').defaultTo(false);
    table.bigInteger('minReloadAmountCents');
    table.bigInteger('maxReloadAmountCents');
    table.bigInteger('maxBalanceCents');
    table.jsonb('restrictions'); // product categories, min order, etc.
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('code');
    table.index('status');
    table.index('purchasedBy');
    table.index('assignedTo');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('promotionGiftCard');
};
