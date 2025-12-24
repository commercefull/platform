/**
 * Migration: Create B2B Price List Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bPriceList');
  if (hasTable) return;

  await knex.schema.createTable('b2bPriceList', table => {
    table.uuid('priceListId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('companyIds').defaultTo('[]');
    table.jsonb('companyTiers').defaultTo('[]');
    table.decimal('baseDiscountPercent', 5, 2);
    table.jsonb('categoryDiscounts');
    table.jsonb('volumeTiers');
    table.string('contractId');
    table.timestamp('validFrom').notNullable();
    table.timestamp('validTo').notNullable();
    table.integer('paymentTermsDays').defaultTo(30);
    table.decimal('minOrderValue', 12, 2);
    table.decimal('freeShippingThreshold', 12, 2);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['isActive']);
    table.index(['validFrom', 'validTo']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bPriceList');
};
