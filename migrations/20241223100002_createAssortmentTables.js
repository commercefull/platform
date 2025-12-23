/**
 * Migration: Create Assortment Tables
 * Phase 2: Assortment & Pricing - Catalog visibility scoping
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
      table.string('scopeType', 20).notNullable(); // 'store', 'seller', 'account', 'channel'
      table.boolean('isDefault').defaultTo(false);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      table.timestamp('deletedAt').nullable();
      
      table.index('organizationId');
      table.index('scopeType');
      table.index('isDefault');
    });
  }

  // Create assortmentScope table
  const hasAssortmentScope = await knex.schema.hasTable('assortmentScope');
  if (!hasAssortmentScope) {
    await knex.schema.createTable('assortmentScope', (table) => {
      table.string('assortmentScopeId', 50).primary();
      table.string('assortmentId', 50).notNullable();
      table.string('storeId', 50).nullable();
      table.string('sellerId', 50).nullable();
      table.string('accountId', 50).nullable();
      table.string('channelId', 50).nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      
      table.index('assortmentId');
      table.index('storeId');
      table.index('sellerId');
      table.index('accountId');
      table.index('channelId');
    });
  }

  // Create assortmentItem table
  const hasAssortmentItem = await knex.schema.hasTable('assortmentItem');
  if (!hasAssortmentItem) {
    await knex.schema.createTable('assortmentItem', (table) => {
      table.string('assortmentItemId', 50).primary();
      table.string('assortmentId', 50).notNullable();
      table.string('productVariantId', 50).notNullable();
      table.string('visibility', 20).defaultTo('listed'); // 'listed', 'hidden'
      table.boolean('buyable').defaultTo(true);
      table.integer('minQty').defaultTo(1);
      table.integer('maxQty').nullable();
      table.integer('incrementQty').defaultTo(1);
      table.integer('leadTimeDays').nullable();
      table.date('discontinueDate').nullable();
      table.integer('sortOrder').defaultTo(0);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      
      table.unique(['assortmentId', 'productVariantId']);
      table.index('assortmentId');
      table.index('productVariantId');
      table.index('visibility');
      table.index('buyable');
    });
  }

  // Create priceListScope table for multi-scope pricing
  const hasPriceListScope = await knex.schema.hasTable('priceListScope');
  if (!hasPriceListScope) {
    await knex.schema.createTable('priceListScope', (table) => {
      table.string('priceListScopeId', 50).primary();
      table.string('priceListId', 50).notNullable();
      table.string('storeId', 50).nullable();
      table.string('channelId', 50).nullable();
      table.string('accountId', 50).nullable();
      table.string('sellerId', 50).nullable();
      table.string('customerSegmentId', 50).nullable();
      table.integer('priority').defaultTo(0); // Higher = more specific
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      
      table.index('priceListId');
      table.index('storeId');
      table.index('channelId');
      table.index('accountId');
      table.index('sellerId');
      table.index('priority');
    });
  }

  // Add organizationId and type to priceList if not exists
  const hasPriceListOrgId = await knex.schema.hasColumn('priceList', 'organizationId');
  if (!hasPriceListOrgId) {
    await knex.schema.alterTable('priceList', (table) => {
      table.string('organizationId', 50).nullable();
      table.string('type', 20).defaultTo('retail'); // 'retail', 'wholesale', 'contract', 'promo'
    });
  }
};

exports.down = async function(knex) {
  // Remove priceListScope table
  await knex.schema.dropTableIfExists('priceListScope');
  
  // Remove assortmentItem table
  await knex.schema.dropTableIfExists('assortmentItem');
  
  // Remove assortmentScope table
  await knex.schema.dropTableIfExists('assortmentScope');
  
  // Remove assortment table
  await knex.schema.dropTableIfExists('assortment');

  // Remove added columns from priceList
  const hasPriceListOrgId = await knex.schema.hasColumn('priceList', 'organizationId');
  if (hasPriceListOrgId) {
    await knex.schema.alterTable('priceList', (table) => {
      table.dropColumn('organizationId');
      table.dropColumn('type');
    });
  }
};
