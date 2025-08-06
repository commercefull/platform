/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentMediaUsage', t => {
    t.uuid('contentMediaUsageId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('mediaId').notNullable().references('contentMediaId').inTable('contentMedia').onDelete('CASCADE');
    t.enum('entityType', ['contentPage', 'contentBlock', 'product', 'category', 'merchant', 'blog']).notNullable();
    t.uuid('entityId').notNullable();
    t.string('field', 100);
    t.integer('sortOrder').defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.index('mediaId');
    t.index(['entityType', 'entityId']);
    t.unique(['mediaId', 'entityType', 'entityId', 'field'], { indexName: 'contentMediaUsageUniquePlacement' });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentMediaUsage');
};
