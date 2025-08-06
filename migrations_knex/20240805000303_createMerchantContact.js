/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('merchantContact', t => {
      t.uuid('merchantContactId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
      t.string('firstName', 100).notNullable();
      t.string('lastName', 100).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 30);
      t.string('jobTitle', 100);
      t.boolean('isPrimary').notNullable().defaultTo(false);
      t.enum('department', ['general', 'sales', 'support', 'billing', 'technical', 'logistics', 'returns']).defaultTo('general');
      t.text('notes');
      t.jsonb('metadata');
      t.index('merchantId');
      t.index('email');
      t.index('isPrimary');
      t.index('department');
    })
    .then(() => {
      return knex.schema.raw('CREATE UNIQUE INDEX merchant_contact_is_primary_unique_index ON "merchantContact" ("merchantId", "isPrimary") WHERE "isPrimary" = true');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantContact');
};
