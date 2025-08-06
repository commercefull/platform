exports.up = function(knex) {
  return knex.schema.createTable('channels', t => {
    t.uuid('channelId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('code', 100).notNullable().unique();
    t.string('type', 50).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('settings');

    t.index('code');
    t.index('type');
    t.index('isActive');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('channels');
};
