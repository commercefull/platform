/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('identityMerchantSession', t => {
    t.uuid('merchantSessionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('sessionToken', 255).notNullable().unique();
    t.string('ipAddress', 45);
    t.text('userAgent');
    t.jsonb('deviceInfo');
    t.timestamp('expiresAt').notNullable();
    t.timestamp('lastActivityAt').notNullable().defaultTo(knex.fn.now());
    t.boolean('isActive').notNullable().defaultTo(true);
    t.index('merchantId');
    t.index('expiresAt');
    t.index('isActive');
    t.unique(['merchantId', 'sessionToken']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('identityMerchantSession');
};
