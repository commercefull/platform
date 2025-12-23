/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipContentAccess', t => {
    t.uuid('membershipContentAccessId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('planId').notNullable().references('membershipPlanId').inTable('membershipPlan').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enum('accessType', ['contentPage', 'category', 'product', 'media', 'download', 'feature']).notNullable();
    t.specificType('accessibleIds', 'uuid[]');
    t.jsonb('conditions');

    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('planId');
    t.index('isActive');
    t.index('accessType');
    t.index('accessibleIds', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipContentAccess');
};
