/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerGroup', t => {
    t.uuid('customerGroupId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.string('code', 50).notNullable().unique();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.decimal('discountPercent', 5, 2).defaultTo(0);
    
    t.uuid('createdBy');
    t.timestamp('deletedAt');
    t.index('code');
    t.index('isActive');
    t.index('isSystem');
    t.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerGroup');
};
