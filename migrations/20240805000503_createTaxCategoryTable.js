exports.up = function(knex) {
    return knex.schema.createTable('taxCategory', t => {
    t.uuid('taxCategoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    

    t.index('code');
    t.index('isDefault');
    t.index('isActive');
    t.index('sortOrder');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxCategory');
};
