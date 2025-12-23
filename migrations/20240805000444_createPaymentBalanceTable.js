exports.up = function (knex) {
  return knex.schema.createTable('paymentBalance', t => {
    t.uuid('paymentBalanceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant');
    t.decimal('availableAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('pendingAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('reservedAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('totalVolume', 15, 2).notNullable().defaultTo(0);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('lastPayoutDate');
    t.timestamp('nextPayoutDate');
    t.decimal('nextPayoutAmount', 15, 2);

    t.unique(['merchantId', 'currencyCode']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('paymentBalance');
};
