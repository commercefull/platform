/**
 * Notification Template Translation Table
 * Stores multi-language translations for email/SMS/push notification templates
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationTemplateTranslation', t => {
    t.uuid('notificationTemplateTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('notificationTemplateId').notNullable().references('notificationTemplateId').inTable('notificationTemplate').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Email translations
    t.string('subject', 255);
    t.string('preheader', 255); // Email preview text
    t.text('htmlTemplate');
    t.text('textTemplate');
    // SMS translations
    t.text('smsTemplate');
    // Push notification translations
    t.string('pushTitle', 255);
    t.text('pushBody');
    // In-app notification translations
    t.string('inAppTitle', 255);
    t.text('inAppBody');
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50);
    t.boolean('isApproved').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    // Preview data for testing
    t.jsonb('previewData');

    t.index('notificationTemplateId');
    t.index('localeId');
    t.index('isActive');
    t.unique(['notificationTemplateId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationTemplateTranslation');
};
