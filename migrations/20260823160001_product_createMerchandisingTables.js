/**
 * Create merchandising rule and category manual order tables
 */

exports.up = async function (knex) {
  const hasMerchTable = await knex.schema.hasTable('merchandisingRule');
  if (!hasMerchTable) {
    await knex.schema.createTable('merchandisingRule', t => {
      t.uuid('ruleId').primary().defaultTo(knex.raw('uuidv7()'));
      t.string('ruleType').notNullable(); // 'boost' | 'bury' | 'pin'
      t.uuid('productId').notNullable();
      t.integer('position').nullable();
      t.string('searchTerm').nullable();
      t.uuid('categoryId').nullable();
      t.boolean('isActive').notNullable().defaultTo(true);
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      t.index(['ruleType', 'isActive'], 'idx_merchRule_type_active');
      t.index(['categoryId', 'isActive'], 'idx_merchRule_category_active');
      t.index(['searchTerm', 'isActive'], 'idx_merchRule_search_active');
    });
  }

  const hasManualOrderTable = await knex.schema.hasTable('categoryManualOrder');
  if (!hasManualOrderTable) {
    await knex.schema.createTable('categoryManualOrder', t => {
      t.uuid('orderId').primary().defaultTo(knex.raw('uuidv7()'));
      t.uuid('categoryId').notNullable();
      t.uuid('productId').notNullable();
      t.integer('position').notNullable();
      t.boolean('isActive').notNullable().defaultTo(true);
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      t.unique(['categoryId', 'productId'], 'uq_categoryManualOrder_category_product');
      t.index(['categoryId', 'position'], 'idx_categoryManualOrder_category_position');
    });
  }
};

exports.down = async function (knex) {
  const hasManualOrderTable = await knex.schema.hasTable('categoryManualOrder');
  if (hasManualOrderTable) {
    await knex.schema.dropTable('categoryManualOrder');
  }

  const hasMerchTable = await knex.schema.hasTable('merchandisingRule');
  if (hasMerchTable) {
    await knex.schema.dropTable('merchandisingRule');
  }
};
