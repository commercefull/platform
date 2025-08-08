/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerPasswordReset', t => {
    t.uuid('customerPasswordResetId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('userId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('token', 255).notNullable();
    t.timestamp('expiresAt').notNullable();
    t.boolean('isUsed').notNullable().defaultTo(false);
    t.index('userId');
    t.index('expiresAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerPasswordReset');
};
