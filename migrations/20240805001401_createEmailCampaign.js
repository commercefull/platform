/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('emailCampaign', function(table) {
    table.uuid('emailCampaignId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('merchantId').references('merchantId').inTable('merchant').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('subject').notNullable();
    table.string('preheader');
    table.string('fromName');
    table.string('fromEmail');
    table.string('replyTo');
    table.text('bodyHtml');
    table.text('bodyText');
    table.string('status').defaultTo('draft').checkIn(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled']);
    table.string('campaignType').defaultTo('regular').checkIn(['regular', 'automated', 'ab_test', 'transactional']);
    table.uuid('templateId');
    table.jsonb('segmentIds').defaultTo('[]');
    table.jsonb('tags').defaultTo('[]');
    table.timestamp('scheduledAt');
    table.timestamp('sentAt');
    table.integer('totalRecipients').defaultTo(0);
    table.integer('sentCount').defaultTo(0);
    table.integer('deliveredCount').defaultTo(0);
    table.integer('openCount').defaultTo(0);
    table.integer('uniqueOpenCount').defaultTo(0);
    table.integer('clickCount').defaultTo(0);
    table.integer('uniqueClickCount').defaultTo(0);
    table.integer('bounceCount').defaultTo(0);
    table.integer('softBounceCount').defaultTo(0);
    table.integer('hardBounceCount').defaultTo(0);
    table.integer('unsubscribeCount').defaultTo(0);
    table.integer('complaintCount').defaultTo(0);
    table.decimal('revenue', 15, 2).defaultTo(0);
    table.integer('conversionCount').defaultTo(0);
    table.decimal('openRate', 5, 2);
    table.decimal('clickRate', 5, 2);
    table.jsonb('abTestConfig');
    table.string('winningVariant');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('merchantId');
    table.index('status');
    table.index('campaignType');
    table.index('scheduledAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('emailCampaign');
};
