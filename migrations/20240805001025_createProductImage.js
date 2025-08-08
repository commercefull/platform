/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productImage', t => {
    t.uuid('productImageId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.text('url').notNullable();
    t.string('alt', 255);
    t.string('title', 255);
    t.enum('type', ['main', 'thumbnail', 'gallery', 'swatch', 'lifestyle', 'detail'], { useNative: true, enumName: 'productImageType' }).notNullable().defaultTo('main');
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.integer('sortOrder').defaultTo(0);
    t.integer('width');
    t.integer('height');
    t.integer('size');
    t.string('mimeType', 50);
    
    t.index('productId');
    t.index('productVariantId');
    t.index('type');
    t.index('isPrimary');
    t.index('sortOrder');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productImage');
};
