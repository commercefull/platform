/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('store', t => {
    t.uuid('storeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('slug', 150).notNullable().unique();
    t.text('description');
    t.enum('storeType', ['merchant_store', 'business_store']).notNullable();
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.uuid('businessId').references('businessId').inTable('business');
    t.text('logo');
    t.text('banner');
    t.text('favicon');
    t.string('primaryColor', 7);
    t.string('secondaryColor', 7);
    t.string('theme', 50);
    t.jsonb('colorScheme');
    t.text('storeUrl');
    t.string('storeEmail', 255);
    t.string('storePhone', 30);
    t.jsonb('address');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.decimal('storeRating', 3, 2);
    t.integer('reviewCount');
    t.integer('followerCount');
    t.integer('productCount');
    t.integer('orderCount');
    t.jsonb('storePolicies');
    t.specificType('shippingMethods', 'text[]');
    t.specificType('paymentMethods', 'text[]');
    t.specificType('supportedCurrencies', 'text[]');
    t.string('defaultCurrency', 3).notNullable().defaultTo('USD');
    t.jsonb('settings');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.specificType('metaKeywords', 'text[]');
    t.jsonb('socialLinks');
    t.jsonb('openingHours');
    t.jsonb('customPages');
    t.jsonb('customFields');
    t.jsonb('metadata');

    t.index('storeType');
    t.index('merchantId');
    t.index('businessId');
    t.index('isActive');
    t.index('isVerified');
    t.index('isFeatured');
    t.index('slug');
    t.index('storeUrl');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('store');
};
