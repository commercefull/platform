/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('product', t => {
    t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('sku', 100).notNullable().unique();
    t.string('name', 255).notNullable();
    t.string('slug', 255).notNullable().unique();
    t.text('description');
    t.uuid('brandId').references('productBrandId').inTable('productBrand');
    t.enu('type', ['simple', 'configurable', 'grouped', 'virtual', 'downloadable', 'bundle', 'subscription'])
      .notNullable()
      .defaultTo('simple');
    t.enu('status', ['draft', 'active', 'inactive', 'archived', 'discontinued']).notNullable().defaultTo('draft');
    t.enu('visibility', ['visible', 'not_visible', 'catalog', 'search']).notNullable().defaultTo('visible');
    t.decimal('price', 15, 2).notNullable();
    t.decimal('basePrice', 15, 2);
    t.decimal('salePrice', 15, 2);
    t.decimal('costPrice', 15, 2);
    t.decimal('compareAtPrice', 15, 2);
    t.string('taxClass', 50).defaultTo('standard');
    t.decimal('taxRate', 5, 2);
    t.boolean('isTaxable').notNullable().defaultTo(true);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.boolean('isInventoryManaged').notNullable().defaultTo(true);
    t.integer('minOrderQuantity').defaultTo(1);
    t.integer('maxOrderQuantity');
    t.integer('orderIncrementQuantity').defaultTo(1);
    t.decimal('weight', 10, 2);
    t.string('weightUnit', 10).defaultTo('g');
    t.decimal('length', 10, 2);
    t.decimal('width', 10, 2);
    t.decimal('height', 10, 2);
    t.string('dimensionUnit', 5).defaultTo('cm');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('hsCode', 20);
    t.string('countryOfOrigin', 2);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.boolean('isNew').notNullable().defaultTo(false);
    t.boolean('isBestseller').notNullable().defaultTo(false);
    t.integer('warningThreshold');
    t.boolean('preorderEnabled').notNullable().defaultTo(false);
    t.timestamp('preorderReleaseDate');
    t.integer('preorderAllowance');
    t.decimal('averageRating', 3, 2);
    t.integer('reviewCount').defaultTo(0);
    t.jsonb('customFields');
    t.jsonb('seoData');
    t.specificType('relatedProducts', 'uuid[]');
    t.specificType('crossSellProducts', 'uuid[]');
    t.specificType('upSellProducts', 'uuid[]');
    t.text('shortDescription');
    t.string('metaKeywords', 255);

    t.boolean('isVirtual').notNullable().defaultTo(false);
    t.boolean('isDownloadable').notNullable().defaultTo(false);
    t.boolean('isSubscription').notNullable().defaultTo(false);

    t.string('currencyCode', 3).defaultTo('USD');
    t.uuid('primaryImageId');
    t.timestamp('publishedAt');
    t.timestamp('deletedAt');
    t.uuid('userId');
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.text('returnPolicy');
    t.text('warranty');
    t.string('externalId', 255);
    t.boolean('hasVariants').notNullable().defaultTo(false);
    t.jsonb('variantAttributes');

    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('sku');
    t.index('name');
    t.index('slug');
    t.index('brandId');
    t.index('type');
    t.index('status');
    t.index('visibility');
    t.index('price');
    t.index('salePrice');
    t.index('isFeatured');
    t.index('isNew');
    t.index('isBestseller');
    t.index('averageRating');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('product');
};
