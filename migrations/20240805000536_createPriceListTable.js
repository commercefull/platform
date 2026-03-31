exports.up = function (knex) {
  return knex.schema.createTable('priceList', t => {
    t.uuid('priceListId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('priority').defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.uuid('organizationId').nullable();
    t.string('type', 20).defaultTo('retail');

    t.index('name');
    t.index('isActive');
    t.index('organizationId');
    t.index('type');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('priceList');
};
