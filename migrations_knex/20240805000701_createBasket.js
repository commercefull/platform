/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('basket', t => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('customerId').references('id').inTable('customer');
      t.string('sessionId', 255);
      t.enum('status', ['active', 'merged', 'converted', 'abandoned', 'completed']).notNullable().defaultTo('active');
      t.string('currency', 3).notNullable().defaultTo('USD');
      t.integer('itemsCount').notNullable().defaultTo(0);
      t.decimal('subTotal', 15, 2).notNullable().defaultTo(0);
      t.decimal('taxAmount', 15, 2).notNullable().defaultTo(0);
      t.decimal('discountAmount', 15, 2).notNullable().defaultTo(0);
      t.decimal('shippingAmount', 15, 2).notNullable().defaultTo(0);
      t.decimal('grandTotal', 15, 2).notNullable().defaultTo(0);
      t.jsonb('meta');
      t.timestamp('expiresAt');
      t.uuid('convertedToOrderId');
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('lastActivityAt').notNullable().defaultTo(knex.fn.now());
      t.index('customerId');
      t.index('sessionId');
      t.index('status');
      t.index('lastActivityAt');
      t.index('expiresAt');
      t.index('convertedToOrderId');
    })
    .then(() => knex.schema.raw('CREATE UNIQUE INDEX basket_customer_id_status_active_idx ON basket ("customerId", status) WHERE status = \'active\' AND "customerId" IS NOT NULL'))
    .then(() => knex.schema.raw('CREATE UNIQUE INDEX basket_session_id_status_active_idx ON basket ("sessionId", status) WHERE status = \'active\' AND "sessionId" IS NOT NULL AND "customerId" IS NULL'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basket');
};
