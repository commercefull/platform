/**
 * Migration: Create Tax Exemption Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('taxExemption');
  if (hasTable) return;

  await knex.schema.createTable('taxExemption', table => {
    table.uuid('taxExemptionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('accountId').notNullable();
    table.string('type', 30).notNullable(); // 'resale', 'nonprofit', 'government', 'manufacturing'
    table.string('certificateRef', 100).nullable();
    table.string('certificateDocument', 255).nullable(); // URL to uploaded certificate
    table.string('jurisdiction', 50).nullable(); // State/country where valid
    table.date('validFrom').notNullable();
    table.date('validTo').nullable();
    table.string('status', 20).defaultTo('active'); // 'active', 'expired', 'revoked'
    table.timestamp('verifiedAt').nullable();
    table.string('verifiedBy', 50).nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('accountId');
    table.index('type');
    table.index('status');
    table.index('jurisdiction');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('taxExemption');
};
