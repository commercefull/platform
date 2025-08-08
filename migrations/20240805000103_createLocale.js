/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('locale', t => {
      t.uuid('localeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.string('code', 10).notNullable().unique();
      t.string('name', 100).notNullable();
      t.string('language', 2).notNullable();
      t.string('countryCode', 2);
      t.boolean('isActive').notNullable().defaultTo(true);
      t.boolean('isDefault').notNullable().defaultTo(false);
      t.enum('textDirection', ['ltr', 'rtl']).notNullable().defaultTo('ltr');
      t.string('dateFormat', 50).notNullable().defaultTo('yyyy-MM-dd');
      t.string('timeFormat', 50).notNullable().defaultTo('HH:mm:ss');
      t.string('timeZone', 50).notNullable().defaultTo('UTC');
      t.uuid('defaultCurrencyId').references('currencyId').inTable('currency');
      t.index('code');
      t.index('language');
      t.index('countryCode');
      t.index('isActive');
      t.index('isDefault');
      t.index('defaultCurrencyId');
    });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('locale');
};
