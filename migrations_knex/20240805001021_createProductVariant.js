/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productVariant', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.string('sku', 100).notNullable().unique();
    t.string('name', 255);
    t.enum('status', ['active', 'inactive', 'archived', 'discontinued'], { useNative: true, enumName: 'productVariantStatus' }).notNullable().defaultTo('active');
    t.decimal('price', 15, 2);
    t.decimal('salePrice', 15, 2);
    t.decimal('costPrice', 15, 2);
    t.decimal('compareAtPrice', 15, 2);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.decimal('weight', 10, 2);
    t.decimal('length', 10, 2);
    t.decimal('width', 10, 2);
    t.decimal('height', 10, 2);
    t.jsonb('optionValues').notNullable();
    t.string('barcode', 100);
    t.string('mpn', 100);
    t.integer('position').defaultTo(0);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('productId');
    t.index('sku');
    t.index('status');
    t.index('isDefault');
    t.index('barcode');
    t.index('mpn');
    t.index('position');
    t.index('optionValues', null, 'gin');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idxProductVariantDefault ON productVariant (productId, isDefault) WHERE isDefault = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productVariant')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS productVariantStatus'));
};
