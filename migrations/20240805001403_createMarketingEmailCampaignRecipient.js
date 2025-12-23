/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('marketingEmailCampaignRecipient', function (table) {
    table.uuid('marketingEmailCampaignRecipientId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('marketingEmailCampaignId')
      .notNullable()
      .references('marketingEmailCampaignId')
      .inTable('marketingEmailCampaign')
      .onDelete('CASCADE');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('email').notNullable();
    table.string('firstName');
    table.string('lastName');
    table
      .string('status')
      .defaultTo('pending')
      .checkIn(['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained', 'failed']);
    table.string('variant');
    table.timestamp('sentAt');
    table.timestamp('deliveredAt');
    table.timestamp('firstOpenedAt');
    table.timestamp('lastOpenedAt');
    table.integer('openCount').defaultTo(0);
    table.timestamp('firstClickedAt');
    table.timestamp('lastClickedAt');
    table.integer('clickCount').defaultTo(0);
    table.timestamp('bouncedAt');
    table.string('bounceType').checkIn(['soft', 'hard']);
    table.string('bounceReason');
    table.timestamp('unsubscribedAt');
    table.timestamp('complainedAt');
    table.string('failureReason');
    table.string('messageId');
    table.string('ipAddress');
    table.string('userAgent');
    table.string('deviceType');
    table.string('country');
    table.string('city');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['marketingEmailCampaignId', 'email']);
    table.index('marketingEmailCampaignId');
    table.index('customerId');
    table.index('email');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('marketingEmailCampaignRecipient');
};
