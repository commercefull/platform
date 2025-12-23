/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketHistory', t => {
    t.uuid('basketHistoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('basketId').notNullable().references('basketId').inTable('basket').onDelete('CASCADE');
    t.enum('eventType', [
      'created',
      'itemAdded',
      'itemRemoved',
      'itemUpdated',
      'merged',
      'discountApplied',
      'discountRemoved',
      'cleared',
      'abandoned',
      'converted',
      'expired',
      'restored',
    ]).notNullable();
    t.uuid('entityId');
    t.jsonb('data').notNullable();
    t.uuid('userId');
    t.string('ipAddress', 50);
    t.text('userAgent');
    t.index('basketId');
    t.index('eventType');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketHistory');
};
