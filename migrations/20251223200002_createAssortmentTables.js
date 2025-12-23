/**
 * Migration: Create Assortment Tables
 * Adds product assortment management for controlling product visibility per store/channel
 */

exports.up = async function(knex) {
  // Create assortment table
  const hasAssortment = await knex.schema.hasTable('assortment');
  if (!hasAssortment) {
    await knex.schema.createTable('assortment', (table) => {
      table.string('assortmentId', 50).primary();
      table.string('organizationId', 50).notNullable();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.string('scopeType', 30).notNullable(); // 'global', 'store', 'channel', 'seller', 'account'
      table.boolean('isDefault').defaultTo(false);
      table.boolean('isActive').defaultTo(true);
      table.jsonb('metadata').defaultTo('{}');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      table.timestamp('deletedAt').nullable();

      table.index('organizationId');
      table.index('scopeType');
      table.index('isDefault');
      table.index('isActive');
    });
  }

  // Create assortmentScope table for linking assortments to specific stores/channels/sellers
  const hasAssortmentScope = await knex.schema.hasTable('assortmentScope');
  if (!hasAssortmentScope) {
    await knex.schema.createTable('assortmentScope', (table) => {
      table.string('scopeId', 50).primary();
      table.string('assortmentId', 50).notNullable();
      table.string('scopeType', 30).notNullable(); // 'store', 'channel', 'seller', 'account'
      table.string('scopeEntityId', 50).notNullable(); // storeId, channelId, sellerId, or accountId
      table.integer('priority').defaultTo(0);
      table.timestamp('effectiveFrom').nullable();
      table.timestamp('effectiveTo').nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());

      table.unique(['assortmentId', 'scopeType', 'scopeEntityId']);
      table.index('assortmentId');
      table.index('scopeType');
      table.index('scopeEntityId');
    });
  }

  // Create assortmentItem table for products in an assortment
  const hasAssortmentItem = await knex.schema.hasTable('assortmentItem');
  if (!hasAssortmentItem) {
    await knex.schema.createTable('assortmentItem', (table) => {
      table.string('itemId', 50).primary();
      table.string('assortmentId', 50).notNullable();
      table.string('productVariantId', 50).notNullable();
      table.string('visibility', 20).defaultTo('visible'); // 'visible', 'hidden', 'search_only'
      table.boolean('buyable').defaultTo(true);
      table.integer('minQty').defaultTo(1);
      table.integer('maxQty').nullable();
      table.integer('sortOrder').defaultTo(0);
      table.jsonb('overrides').defaultTo('{}'); // Price, name overrides
      table.timestamp('effectiveFrom').nullable();
      table.timestamp('effectiveTo').nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.unique(['assortmentId', 'productVariantId']);
      table.index('assortmentId');
      table.index('productVariantId');
      table.index('visibility');
      table.index('buyable');
    });
  }

  // Create assortmentRule table for dynamic assortment rules
  const hasAssortmentRule = await knex.schema.hasTable('assortmentRule');
  if (!hasAssortmentRule) {
    await knex.schema.createTable('assortmentRule', (table) => {
      table.string('ruleId', 50).primary();
      table.string('assortmentId', 50).notNullable();
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
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('assortmentRule');
  await knex.schema.dropTableIfExists('assortmentItem');
  await knex.schema.dropTableIfExists('assortmentScope');
  await knex.schema.dropTableIfExists('assortment');
};
