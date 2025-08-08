exports.up = function(knex) {
  return knex.schema.createTable('productTag', t => {
    t.uuid('productTagId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('slug', 100).unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(true);
    

    t.index('slug');
    t.index('isActive');
    t.index('merchantId');
    t.index('isGlobal');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productTag');
};
