/**
 * Migration: Create Store Settings Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storeSettings');
  if (hasTable) return;

  await knex.schema.createTable('storeSettings', table => {
    table.uuid('storeSettingsId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('storeId').notNullable().unique();
    table.string('inventoryMode').defaultTo('shared'); // shared, dedicated, hybrid
    table.string('inventoryLocationId');
    table.string('priceListId');
    table.string('taxProfileId');
    table.boolean('canFulfillOnline').defaultTo(true);
    table.boolean('canPickupInStore').defaultTo(false);
    table.boolean('localDeliveryEnabled').defaultTo(false);
    table.decimal('localDeliveryRadius', 10, 2);
    table.string('localDeliveryRadiusUnit').defaultTo('km');
    table.jsonb('operatingHours');
    table.jsonb('pickupHours');
    table.integer('pickupLeadTimeMinutes').defaultTo(60);
    table.integer('maxDailyPickups');
    table.jsonb('customSettings');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['storeId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeSettings');
};
