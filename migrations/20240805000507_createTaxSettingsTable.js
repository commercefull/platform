exports.up = function(knex) {
  return knex.schema.createTable('taxSettings', t => {
    t.uuid('taxSettingsId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').unique();
    t.enum('calculationMethod', ['unitBased', 'itemBased']).notNullable().defaultTo('unitBased');
    t.boolean('pricesIncludeTax').notNullable().defaultTo(false);
    t.boolean('displayPricesWithTax').notNullable().defaultTo(false);
    t.enum('taxBasedOn', ['shippingAddress', 'billingAddress']).notNullable().defaultTo('shippingAddress');
    t.uuid('shippingTaxClass').references('taxCategoryId').inTable('taxCategory');
    t.enum('displayTaxTotals', ['itemized', 'summary']).notNullable().defaultTo('itemized');
    t.boolean('applyTaxToShipping').notNullable().defaultTo(true);
    t.boolean('applyDiscountBeforeTax').notNullable().defaultTo(true);
    t.boolean('roundTaxAtSubtotal').notNullable().defaultTo(false);
    t.integer('taxDecimalPlaces').notNullable().defaultTo(2);
    t.uuid('defaultTaxCategory').references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.uuid('defaultTaxZone').references('taxZoneId').inTable('taxZone').onDelete('CASCADE');
    t.enum('taxProvider', ['internal', 'external']).defaultTo('internal');
    t.jsonb('taxProviderSettings');
    
    t.index('merchantId');
    t.index('calculationMethod');
    t.index('taxBasedOn');
    t.index('shippingTaxClass');
    t.index('defaultTaxCategory');
    t.index('defaultTaxZone');
    t.index('taxProvider');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxSettings');
};
