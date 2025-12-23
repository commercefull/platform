/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('marketingEmailTemplate', function (table) {
    table.uuid('marketingEmailTemplateId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('merchantId').references('merchantId').inTable('merchant').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('slug').unique();
    table
      .string('category')
      .defaultTo('marketing')
      .checkIn(['marketing', 'transactional', 'notification', 'abandoned_cart', 'welcome', 'custom']);
    table.text('description');
    table.string('subject');
    table.string('preheader');
    table.text('bodyHtml');
    table.text('bodyText');
    table.jsonb('variables').defaultTo('[]');
    table.string('thumbnailUrl');
    table.boolean('isDefault').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table.integer('usageCount').defaultTo(0);
    table.timestamp('lastUsedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('merchantId');
    table.index('category');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('marketingEmailTemplate');
};
