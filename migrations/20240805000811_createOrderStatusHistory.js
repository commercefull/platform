/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderStatusHistory', t => {
    t.uuid('orderStatusHistoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.string('previousStatus', 50);
    t.string('newStatus', 50).notNullable();
    t.text('comment');
    t.uuid('changedBy');
    t.boolean('notifyCustomer').notNullable().defaultTo(false);
    
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
