/**
 * Migration: Create Channel Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('channel');
  if (hasTable) return;

  await knex.schema.createTable('channel', table => {
    table.uuid('channelId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.string('code').notNullable().unique();
    table.string('type').notNullable(); // web, mobile_app, marketplace, social, pos, wholesale, api, b2b_portal
    table.string('ownerType').notNullable().defaultTo('platform'); // platform, merchant, business
    table.string('ownerId');
    table.jsonb('storeIds').defaultTo('[]');
    table.string('defaultStoreId');
    table.string('catalogId');
    table.string('priceListId');
    table.string('currencyCode').notNullable().defaultTo('USD');
    table.string('localeCode').notNullable().defaultTo('en-US');
    table.jsonb('warehouseIds').defaultTo('[]');
    table.string('fulfillmentStrategy').defaultTo('nearest'); // nearest, priority, round_robin, merchant_assigned
    table.boolean('requiresApproval').defaultTo(false);
    table.boolean('allowCreditPayment').defaultTo(false);
    table.boolean('b2bPricingEnabled').defaultTo(false);
    table.decimal('commissionRate', 5, 4);
    table.boolean('merchantVisible').defaultTo(true);
    table.boolean('isActive').defaultTo(true);
    table.boolean('isDefault').defaultTo(false);
    table.jsonb('settings');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['ownerType', 'ownerId']);
    table.index(['isActive']);
    table.index(['type']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('channel');
};
