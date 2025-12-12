/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('fraudCheck', function(table) {
    table.uuid('fraudCheckId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('orderId').references('orderId').inTable('order').onDelete('CASCADE');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('checkType').notNullable(); // pre_auth, post_auth, manual
    table.string('status').defaultTo('pending'); // pending, passed, flagged, blocked, reviewed, overridden
    table.integer('riskScore').defaultTo(0); // 0-100
    table.string('riskLevel').defaultTo('low'); // low, medium, high, critical
    table.jsonb('triggeredRules'); // Array of rule IDs and details
    table.jsonb('signals'); // Risk signals detected
    table.jsonb('deviceFingerprint');
    table.string('ipAddress');
    table.string('ipCountry');
    table.string('ipCity');
    table.boolean('ipIsProxy').defaultTo(false);
    table.boolean('ipIsVpn').defaultTo(false);
    table.boolean('ipIsTor').defaultTo(false);
    table.string('billingCountry');
    table.string('shippingCountry');
    table.boolean('addressMismatch').defaultTo(false);
    table.boolean('highRiskCountry').defaultTo(false);
    table.integer('previousOrders').defaultTo(0);
    table.integer('previousChargebacks').defaultTo(0);
    table.decimal('orderAmount', 15, 2);
    table.string('currency', 3);
    table.boolean('isFirstOrder').defaultTo(false);
    table.boolean('isGuestCheckout').defaultTo(false);
    table.string('paymentMethod');
    table.string('cardBin');
    table.string('cardCountry');
    table.boolean('cardBinMismatch').defaultTo(false);
    table.string('reviewedBy');
    table.timestamp('reviewedAt');
    table.string('reviewDecision'); // approved, rejected
    table.text('reviewNotes');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('orderId');
    table.index('customerId');
    table.index('status');
    table.index('riskLevel');
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('fraudCheck');
};
