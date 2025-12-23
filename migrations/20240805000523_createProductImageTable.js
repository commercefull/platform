exports.up = function (knex) {
  return knex.schema.createTable('productImage', t => {
    t.uuid('productImageId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('SET NULL');
    t.string('url', 2048).notNullable();
    t.string('alt', 255);
    t.string('title', 255);
    t.integer('position').notNullable().defaultTo(0);
    t.integer('width');
    t.integer('height');
    t.integer('size');
    t.string('type', 50);
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.boolean('isVisible').notNullable().defaultTo(true);

    t.index('productId');
    t.index('productVariantId');
    t.index('isPrimary');
    t.index('isVisible');
    t.index('position');
    t.index(['productId', 'position']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productImage');
};
