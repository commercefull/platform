/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantBalance', t => {
    t.uuid('merchantBalanceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE').unique();
    t.decimal('availableBalance', 15, 2).notNullable().defaultTo(0);
    t.decimal('pendingBalance', 15, 2).notNullable().defaultTo(0);
    t.decimal('reserveBalance', 15, 2).notNullable().defaultTo(0);
    t.decimal('lifetimeRevenue', 15, 2).notNullable().defaultTo(0);
    t.decimal('lifetimeCommission', 15, 2).notNullable().defaultTo(0);
    t.decimal('lifetimePayout', 15, 2).notNullable().defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.timestamp('lastPayoutDate');
    t.timestamp('nextScheduledPayoutDate');
    t.boolean('isPayoutHeld').notNullable().defaultTo(false);
    t.text('payoutHoldReason');
    t.jsonb('metadata');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('availableBalance');
    t.index('pendingBalance');
    t.index('reserveBalance');
    t.index('lastPayoutDate');
    t.index('nextScheduledPayoutDate');
    t.index('isPayoutHeld');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantBalance');
};
