/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('integrationCredential');
  if (hasTable) return;

  await knex.schema.createTable('integrationCredential', t => {
    t.uuid('credentialId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('integrationId').notNullable().references('integration.integrationId').onDelete('CASCADE');
    t.string('type').notNullable();
    t.string('label').notNullable();
    t.text('encryptedData').notNullable();
    t.string('iv').notNullable();
    t.string('authTag').notNullable();
    t.timestamp('expiresAt').nullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['integrationId']);
    t.index(['integrationId', 'isActive']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('integrationCredential');
};
