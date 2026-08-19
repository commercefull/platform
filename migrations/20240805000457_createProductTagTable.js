exports.up = function (knex) {
  return knex.schema.createTable('productTag', t => {
    t.uuid('productTagId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('slug', 100).unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.uuid('organizationId').references('organizationId').inTable('organization');
    t.boolean('isGlobal').notNullable().defaultTo(true);

    t.index('slug');
    t.index('isActive');
    t.index('organizationId');
    t.index('isGlobal');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productTag');
};
