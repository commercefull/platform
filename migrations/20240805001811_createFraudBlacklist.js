/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('fraudBlacklist', function(table) {
    table.uuid('fraudBlacklistId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('type').notNullable(); // email, ip, phone, address, card_bin, device_id, customer
    table.string('value').notNullable();
    table.string('reason');
    table.string('source').defaultTo('manual'); // manual, automatic, chargeback, fraud_report
    table.uuid('relatedOrderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.uuid('relatedCustomerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('expiresAt');
    table.string('addedBy');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.unique(['type', 'value']);
    table.index('type');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('fraudBlacklist');
};
