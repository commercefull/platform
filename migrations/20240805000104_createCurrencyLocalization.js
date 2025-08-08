/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('currencyLocalization', t => {
    t.uuid('currencyLocalizationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('currencyId').notNullable().references('currencyId').inTable('currency').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    t.string('localizedName', 100);
    t.string('localizedSymbol', 10);
    t.string('decimalSeparator', 1);
    t.string('thousandsSeparator', 1);
    t.enum('symbolPosition', ['before', 'after']);
    t.string('format', 100);
    t.index('currencyId');
    t.index('localeId');
    t.unique(['currencyId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('currencyLocalization');
};
