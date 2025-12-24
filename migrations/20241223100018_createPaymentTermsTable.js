/**
 * Migration: Create Payment Terms Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('paymentTerms');
  if (hasTable) return;

  await knex.schema.createTable('paymentTerms', table => {
    table.uuid('paymentTermsId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable();
    table.string('name', 100).notNullable(); // 'Net 30', 'Net 60', 'Due on Receipt'
    table.string('code', 20).unique().notNullable();
    table.integer('days').notNullable();
    table.decimal('discountPercentage', 5, 2).nullable(); // Early payment discount
    table.integer('discountDays').nullable(); // Days for discount eligibility
    table.boolean('isDefault').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('organizationId');
    table.index('isDefault');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('paymentTerms');
};
