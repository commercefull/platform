/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supportAttachment', function (table) {
    table.uuid('supportAttachmentId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('supportTicketId').notNullable().references('supportTicketId').inTable('supportTicket').onDelete('CASCADE');
    table.uuid('supportMessageId').references('supportMessageId').inTable('supportMessage').onDelete('CASCADE');
    table.string('fileName').notNullable();
    table.string('originalName').notNullable();
    table.string('mimeType').notNullable();
    table.integer('fileSize').notNullable();
    table.string('storageUrl').notNullable();
    table.string('thumbnailUrl');
    table.uuid('uploadedBy');
    table.string('uploadedByType'); // customer, agent
    table.boolean('isPublic').defaultTo(false);
    table.boolean('isScanned').defaultTo(false);
    table.boolean('isSafe').defaultTo(true);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('supportTicketId');
    table.index('supportMessageId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('supportAttachment');
};
