/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const ALL_STORES = '00000000-0000-0000-0000-000000000000';

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('recommendationRule');
  if (hasTable) return;

  await knex.schema.createTable('recommendationRule', t => {
    t.uuid('recommendationRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    // No FK: the ALL_STORES sentinel is not a store row.
    t.uuid('storeId').notNullable().defaultTo(ALL_STORES);
    t.string('name', 255).notNullable();
    t.string('sourceType', 20).notNullable(); // category | brand | collection | productType | tag
    t.uuid('sourceId').notNullable();
    t.string('targetType', 20).notNullable(); // category | brand | collection | tag
    t.uuid('targetId').notNullable();
    t.string('relationType', 20).notNullable().defaultTo('related'); // related | accessory | cross_sell | up_sell
    t.string('targetSort', 20).notNullable().defaultTo('bestSelling'); // bestSelling | newest | rating
    t.string('priceBand', 10).notNullable().defaultTo('any'); // any | cheaper | similar | pricier
    t.integer('maxItems').notNullable().defaultTo(4);
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index(['organizationId', 'sourceType', 'sourceId', 'isActive'], 'idx_recoRule_source');
    t.index(['organizationId', 'isActive', 'priority'], 'idx_recoRule_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('recommendationRule');
};
