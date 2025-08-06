/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productImage', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('productVariant').onDelete('CASCADE');
    t.text('url').notNullable();
    t.string('alt', 255);
    t.string('title', 255);
    t.enu('type', ['main', 'thumbnail', 'gallery', 'swatch', 'lifestyle', 'detail'], { useNative: true, enumName: 'productImageType' }).notNullable().defaultTo('main');
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.integer('sortOrder').defaultTo(0);
    t.integer('width');
    t.integer('height');
    t.integer('size');
    t.string('mimeType', 50);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('productId');
    t.index('variantId');
    t.index('type');
    t.index('isPrimary');
    t.index('sortOrder');
  }).then(() => {
    return knex.raw(`CREATE UNIQUE INDEX idxProductImagePrimary ON productImage (productId, isPrimary) WHERE isPrimary = true AND variantId IS NULL`);
  }).then(() => {
    return knex.raw(`CREATE UNIQUE INDEX idxProductImageVariantPrimary ON productImage (productId, variantId, isPrimary) WHERE isPrimary = true AND variantId IS NOT NULL`);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productImage')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS productImageType'));
};
