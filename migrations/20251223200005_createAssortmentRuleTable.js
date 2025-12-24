/**
 * Migration: Create Assortment Rule Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentRule');
  if (hasTable) return;

  await knex.schema.createTable('assortmentRule', table => {
    table.uuid('ruleId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('assortmentId').notNullable();
    table.string('name', 255).notNullable();
    table.string('ruleType', 30).notNullable(); // 'include', 'exclude'
    table.string('conditionType', 30).notNullable(); // 'category', 'brand', 'attribute', 'tag', 'price_range'
    table.jsonb('conditions').notNullable();
    table.integer('priority').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('assortmentId');
    table.index('ruleType');
    table.index('isActive');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentRule');
};
