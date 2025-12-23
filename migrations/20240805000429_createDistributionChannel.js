/**
 * Distribution Channel Migration
 * Creates the distributionChannel table for managing sales channels
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionChannel', t => {
    t.uuid('distributionChannelId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('code', 100).notNullable().unique();
    t.string('type', 50).notNullable(); // online, retail, marketplace, wholesale, mobile
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('settings');

    t.index('code');
    t.index('type');
    t.index('isActive');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionChannel');
};
