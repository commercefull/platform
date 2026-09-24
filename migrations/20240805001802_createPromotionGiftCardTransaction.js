/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('promotionGiftCardTransaction', function (table) {
    table.uuid('promotionGiftCardTransactionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('promotionGiftCardId').notNullable().references('promotionGiftCardId').inTable('promotionGiftCard').onDelete('CASCADE');
    table.string('type').notNullable(); // purchase, reload, redemption, refund, adjustment, expiration
    table.bigInteger('amountCents').notNullable();
    table.bigInteger('balanceBeforeCents').notNullable();
    table.bigInteger('balanceAfterCents').notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('performedBy');
    table.string('performedByType'); // customer, admin, system
    table.text('notes');
    table.string('referenceNumber');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('promotionGiftCardId');
    table.index('orderId');
    table.index('type');
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('promotionGiftCardTransaction');
};
