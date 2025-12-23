/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('marketingAbandonedCartEmail', function (table) {
    table.uuid('marketingAbandonedCartEmailId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('marketingAbandonedCartId')
      .notNullable()
      .references('marketingAbandonedCartId')
      .inTable('marketingAbandonedCart')
      .onDelete('CASCADE');
    table.uuid('marketingEmailTemplateId').references('marketingEmailTemplateId').inTable('marketingEmailTemplate').onDelete('SET NULL');
    table.integer('sequenceNumber').notNullable();
    table.string('subject');
    table.text('bodyHtml');
    table.text('bodyText');
    table.string('status').defaultTo('pending').checkIn(['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']);
    table.timestamp('scheduledAt');
    table.timestamp('sentAt');
    table.timestamp('deliveredAt');
    table.timestamp('openedAt');
    table.integer('openCount').defaultTo(0);
    table.timestamp('clickedAt');
    table.integer('clickCount').defaultTo(0);
    table.string('messageId');
    table.string('failureReason');
    table.string('discountCode');
    table.decimal('discountAmount', 15, 2);
    table.string('discountType').checkIn(['percentage', 'fixed']);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['marketingAbandonedCartId', 'sequenceNumber']);
    table.index('marketingAbandonedCartId');
    table.index('status');
    table.index('scheduledAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('marketingAbandonedCartEmail');
};
