/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('emailCampaignLink', function(table) {
    table.uuid('emailCampaignLinkId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('emailCampaignId').notNullable().references('emailCampaignId').inTable('emailCampaign').onDelete('CASCADE');
    table.string('originalUrl').notNullable();
    table.string('trackingUrl');
    table.string('linkText');
    table.integer('position');
    table.integer('clickCount').defaultTo(0);
    table.integer('uniqueClickCount').defaultTo(0);
    table.timestamp('firstClickedAt');
    table.timestamp('lastClickedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('emailCampaignId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('emailCampaignLink');
};
