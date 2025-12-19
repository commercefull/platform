/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('adminUserRole', t => {
    t.uuid('userId').notNullable().references('userId').inTable('user').onDelete('CASCADE');
    t.uuid('roleId').notNullable().references('roleId').inTable('role').onDelete('CASCADE');
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.primary(['userId', 'roleId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('adminUserRole');
};
