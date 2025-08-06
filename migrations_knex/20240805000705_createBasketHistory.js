/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketHistory', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('basketId').notNullable().references('id').inTable('basket').onDelete('CASCADE');
    t.enum('eventType', [
      'created', 'item_added', 'item_removed', 'item_updated', 'merged', 
      'discount_applied', 'discount_removed', 'cleared', 'abandoned', 
      'converted', 'expired', 'restored'
    ]).notNullable();
    t.uuid('entityId');
    t.jsonb('data').notNullable();
    t.uuid('userId');
    t.string('ipAddress', 50);
    t.text('userAgent');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
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
