exports.up = function(knex) {
  return knex.schema.createTable('priceList', t => {
    t.uuid('priceListId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('priority').defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('startDate');
    t.timestamp('endDate');

    t.index('name');
    t.index('isActive');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('priceList');
};
