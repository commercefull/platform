/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('priceList', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
        t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
        t.text('customerGroup');
        t.timestamp('validFrom');
        t.timestamp('validTo');
        t.string('currencyCode', 3).notNullable().defaultTo('USD');
        t.enu('priceType', ['fixed', 'percentage_discount', 'percentage_markup'], { useNative: true, enumName: 'priceListType' }).notNullable().defaultTo('fixed');
        t.enu('baseOn', ['original', 'cost', 'msrp'], { useNative: true, enumName: 'priceListBase' }).defaultTo('original');
        t.decimal('percentageValue', 10, 4);
        t.integer('minQuantity').defaultTo(1);
    t.jsonb('metadata');
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        t.uuid('createdBy');
    t.index('code');
        t.index('isActive');
    t.index('priority');
        t.index('customerGroup');
        t.index('validFrom');
        t.index('validTo');
        t.index('currencyCode');
        t.index('priceType');
        t.index('minQuantity');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('priceList')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS priceListType'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS priceListBase'));
};
