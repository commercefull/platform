/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantStore', t => {
    t.uuid('merchantStoreId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE').unique();
    t.string('name', 100).notNullable();
    t.string('slug', 150).notNullable().unique();
    t.text('description');
    t.string('shortDescription', 255);
    t.text('logo');
    t.text('banner');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.string('storeUrl', 255);
    t.string('storeEmail', 255);
    t.string('storePhone', 30);
    t.string('theme', 50).defaultTo('default');
    t.jsonb('colorScheme');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.text('metaKeywords');
    t.jsonb('openingHours');
    t.jsonb('socialLinks');
    t.jsonb('storePolicies');
    t.jsonb('shippingMethods');
    t.jsonb('paymentMethods');
    t.decimal('storeRating', 3, 2);
    t.integer('reviewCount').defaultTo(0);
    t.integer('followerCount').defaultTo(0);
    t.integer('productCount').defaultTo(0);
    t.integer('orderCount').defaultTo(0);
    t.specificType('featuredProducts', 'uuid[]');
    t.jsonb('storeCategories');
    t.jsonb('customPages');
    t.jsonb('customFields');
    
    t.index('name');
    t.index('isActive');
    t.index('isVerified');
    t.index('isFeatured');
    t.index('storeRating');
    t.index('followerCount');
    t.index('productCount');
    t.index('orderCount');
    t.index('featuredProducts', { indexType: 'GIN' });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantStore');
};
