/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantSettings', t => {
    t.uuid('merchantId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('storeName', 255).notNullable();
    t.text('storeUrl');
    t.string('storeEmail', 255);
    t.string('storePhone', 50);
    t.jsonb('storeAddress');
    t.string('timezone', 50).notNullable().defaultTo('UTC');
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.string('locale', 10).notNullable().defaultTo('en-US');
    t.text('logo');
    t.text('favicon');
    t.jsonb('socialLinks');
    t.jsonb('businessInfo');
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantSettings');
};
