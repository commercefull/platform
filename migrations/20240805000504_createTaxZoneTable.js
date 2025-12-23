exports.up = function (knex) {
  return knex.schema.createTable('taxZone', t => {
    t.uuid('taxZoneId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.jsonb('countries').notNullable();
    t.jsonb('states');
    t.jsonb('postcodes');
    t.jsonb('cities');
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('code');
    t.index('isDefault');
    t.index('isActive');
    t.index('countries');
    t.index('states');
    t.index('postcodes');
    t.index('cities');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('taxZone');
};
