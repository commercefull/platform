exports.up = function (knex) {
  return knex.schema.createTable('paymentBalance', t => {
    t.uuid('paymentBalanceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization');
    t.bigInteger('availableAmountCents').notNullable().defaultTo(0);
    t.bigInteger('pendingAmountCents').notNullable().defaultTo(0);
    t.bigInteger('reservedAmountCents').notNullable().defaultTo(0);
    t.bigInteger('totalVolumeCents').notNullable().defaultTo(0);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('lastPayoutDate');
    t.timestamp('nextPayoutDate');
    t.bigInteger('nextPayoutAmountCents');

    t.unique(['organizationId', 'currencyCode']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('paymentBalance');
};
