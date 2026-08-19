exports.up = function (knex) {
  return knex.schema.createTable('paymentBalance', t => {
    t.uuid('paymentBalanceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization');
    t.decimal('availableAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('pendingAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('reservedAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('totalVolume', 15, 2).notNullable().defaultTo(0);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('lastPayoutDate');
    t.timestamp('nextPayoutDate');
    t.decimal('nextPayoutAmount', 15, 2);

    t.unique(['organizationId', 'currencyCode']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('paymentBalance');
};
