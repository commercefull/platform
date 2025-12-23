/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('marketingEmailCampaignLink', function (table) {
    table.uuid('marketingEmailCampaignLinkId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('marketingEmailCampaignId')
      .notNullable()
      .references('marketingEmailCampaignId')
      .inTable('marketingEmailCampaign')
      .onDelete('CASCADE');
    table.string('originalUrl').notNullable();
    table.string('trackingUrl');
    table.string('linkText');
    table.integer('position');
    table.integer('clickCount').defaultTo(0);
    table.integer('uniqueClickCount').defaultTo(0);
    table.timestamp('firstClickedAt');
    table.timestamp('lastClickedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('marketingEmailCampaignId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('marketingEmailCampaignLink');
};
