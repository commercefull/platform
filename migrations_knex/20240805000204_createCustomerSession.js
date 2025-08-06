/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerSession', t => {
    t.uuid('customerSessionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('token', 255).notNullable().unique();
    t.string('ipAddress', 45);
    t.text('userAgent');
    t.jsonb('deviceInfo');
    t.timestamp('expiresAt').notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.index('customerId');
    t.index('expiresAt');
    t.index('isActive');
    t.unique(['customerId', 'token']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerSession');
};
