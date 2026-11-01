/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('market');
  if (hasTable) return;

  await knex.schema.createTable('market', t => {
    t.uuid('marketId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization');
    t.uuid('storeId').references('storeId').inTable('store').onDelete('SET NULL');
    t.string('code', 50).notNullable();
    t.string('name', 255).notNullable();
    t.enum('status', ['draft', 'ready', 'active', 'disabled']).notNullable().defaultTo('draft');
    t.integer('version').notNullable().defaultTo(1);
    t.specificType('countryCodes', 'text[]').notNullable().defaultTo('{}');
    t.string('defaultCurrencyCode', 3).notNullable().references('code').inTable('currency');
    t.specificType('supportedCurrencyCodes', 'text[]').notNullable().defaultTo('{}');
    t.string('defaultLocaleCode', 20).notNullable().defaultTo('en-US');
    t.specificType('supportedLocaleCodes', 'text[]').notNullable().defaultTo('{}');
    t.uuid('catalogAssortmentId').references('storeId').inTable('assortmentStore').onDelete('SET NULL');
    t.uuid('defaultPriceListId').references('priceListId').inTable('pricingPriceList').onDelete('SET NULL');
    t.uuid('contractingEntityId').references('organizationId').inTable('organization').onDelete('SET NULL');
    t.enum('taxDisplayMode', ['inclusive_tax', 'exclusive_tax']).notNullable().defaultTo('exclusive_tax');
    t.boolean('allowDynamicFxConversion').notNullable().defaultTo(false);
    t.jsonb('capabilities').notNullable().defaultTo('{}');
    t.specificType('allowedPaymentMethods', 'text[]').notNullable().defaultTo('{}');
    t.specificType('allowedFulfillmentMethods', 'text[]').notNullable().defaultTo('{}');
    t.specificType('hostnamePatterns', 'text[]').notNullable().defaultTo('{}');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('deletedAt');

    t.unique(['organizationId', 'code']);
    t.index('organizationId');
    t.index('storeId');
    t.index('status');
    t.index('countryCodes', undefined, 'GIN');
    t.index('hostnamePatterns', undefined, 'GIN');
    t.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('market');
};
