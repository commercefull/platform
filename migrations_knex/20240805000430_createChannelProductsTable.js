exports.up = function(knex) {
  return knex.schema.createTable('channelProducts', t => {
    t.uuid('channelProductId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('channelId').notNullable().references('channelId').inTable('channels').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('overrideSku', 100);
    t.decimal('overridePrice', 15, 2);
    t.integer('sortOrder').defaultTo(0);

    t.unique(['channelId', 'productId']);
    t.index('channelId');
    t.index('productId');
    t.index('isActive');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('channelProducts');
};
