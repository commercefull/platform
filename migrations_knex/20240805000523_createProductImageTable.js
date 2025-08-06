exports.up = function(knex) {
  return knex.schema.createTable('product_image', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('product_id').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variant_id').references('id').inTable('product_variant').onDelete('SET NULL');
    t.string('url', 2048).notNullable();
    t.string('alt', 255);
    t.string('title', 255);
    t.integer('position').notNullable().defaultTo(0);
    t.integer('width');
    t.integer('height');
    t.integer('size');
    t.string('type', 50);
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.boolean('is_visible').notNullable().defaultTo(true);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at');

    t.index('product_id');
    t.index('variant_id');
    t.index('is_primary');
    t.index('is_visible');
    t.index('position');
    t.index(['product_id', 'position']);
    t.index('deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_image');
};
