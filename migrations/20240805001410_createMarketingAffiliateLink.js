/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('marketingAffiliateLink', function(table) {
    table.uuid('marketingAffiliateLinkId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('marketingAffiliateId').notNullable().references('marketingAffiliateId').inTable('marketingAffiliate').onDelete('CASCADE');
    table.string('name');
    table.string('shortCode').unique().notNullable();
    table.string('destinationUrl').notNullable();
    table.uuid('productId').references('productId').inTable('product').onDelete('SET NULL');
    table.uuid('productCategoryId').references('productCategoryId').inTable('productCategory').onDelete('SET NULL');
    table.uuid('campaignId');
    table.string('utmSource');
    table.string('utmMedium');
    table.string('utmCampaign');
    table.integer('clickCount').defaultTo(0);
    table.integer('uniqueClickCount').defaultTo(0);
    table.integer('conversionCount').defaultTo(0);
    table.decimal('revenue', 15, 2).defaultTo(0);
    table.decimal('commission', 15, 2).defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('lastClickedAt');
    table.timestamp('expiresAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('marketingAffiliateId');
    table.index('shortCode');
    table.index('productId');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('marketingAffiliateLink');
};
