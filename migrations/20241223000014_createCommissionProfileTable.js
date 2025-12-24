/**
 * Migration: Create Commission Profile Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('commissionProfile');
  if (hasTable) return;

  await knex.schema.createTable('commissionProfile', table => {
    table.uuid('commissionProfileId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.decimal('baseRate', 5, 4).notNullable();
    table.jsonb('categoryRates'); // { categoryId: rate }
    table.jsonb('volumeDiscounts'); // [{ minVolume, rate }]
    table.decimal('fixedFeePerOrder', 12, 2).defaultTo(0);
    table.boolean('isDefault').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('commissionProfile');
};
