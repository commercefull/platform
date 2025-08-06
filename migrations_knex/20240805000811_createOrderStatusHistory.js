/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderStatusHistory', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderId').notNullable().references('id').inTable('order').onDelete('CASCADE');
    t.string('previousStatus', 50);
    t.string('newStatus', 50).notNullable();
    t.text('comment');
    t.uuid('changedBy'); // User ID who changed the status
    t.boolean('notifyCustomer').notNullable().defaultTo(false);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.index('orderId');
    t.index('newStatus');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderStatusHistory');
};
