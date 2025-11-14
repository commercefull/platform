/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderFulfillmentItem', t => {
    t.uuid('orderFulfillmentItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderFulfillmentId').notNullable().references('orderFulfillmentId').inTable('orderFulfillment').onDelete('CASCADE');
    t.uuid('orderItemId').notNullable().references('orderItemId').inTable('orderItem').onDelete('CASCADE');
    t.integer('quantity').notNullable().defaultTo(1);
    t.index('orderFulfillmentId');
    t.index('orderItemId');
    t.unique(['orderFulfillmentId', 'orderItemId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderFulfillmentItem');
};
