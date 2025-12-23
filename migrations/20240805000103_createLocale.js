/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('locale', t => {
    t.uuid('localeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 10).notNullable().unique();
    t.string('name', 100).notNullable();
    t.string('nativeName', 100); // e.g., "Español" for Spanish
    t.string('language', 2).notNullable();
    t.string('countryCode', 2);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.enum('textDirection', ['ltr', 'rtl']).notNullable().defaultTo('ltr');
    t.string('dateFormat', 50).notNullable().defaultTo('yyyy-MM-dd');
    t.string('timeFormat', 50).notNullable().defaultTo('HH:mm:ss');
    t.string('timeZone', 50).notNullable().defaultTo('UTC');
    t.uuid('defaultCurrencyId').references('currencyId').inTable('currency');
    // Number formatting for internationalization
    t.jsonb('numberFormat').defaultTo(
      JSON.stringify({
        decimalSeparator: '.',
        thousandsSeparator: ',',
        decimalPlaces: 2,
      }),
    );
    // Fallback locale for missing translations
    t.uuid('fallbackLocaleId').references('localeId').inTable('locale');
    // Flag icon or image URL
    t.string('flagIcon', 255);
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
