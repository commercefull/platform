/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('compliancePolicyRule');
  if (hasTable) return;

  await knex.schema.createTable('compliancePolicyRule', t => {
    t.uuid('compliancePolicyRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('organizationId').references('organizationId').inTable('organization').onDelete('CASCADE');
    t.string('policyCode', 100).notNullable();
    t.string('name', 255).notNullable();
    t.enum('domain', ['compliance', 'tax', 'promotion', 'returns', 'marketplace', 'privacy']).notNullable();
    t.string('version', 50).notNullable().defaultTo('1.0.0');
    t.enum('effect', ['allow', 'deny', 'require_obligation']).notNullable();
    t.string('reasonCode', 100).notNullable();
    t.specificType('obligations', 'text[]').notNullable().defaultTo('{}');
    t.jsonb('conditions').notNullable().defaultTo('[]');
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('effectiveFrom');
    t.timestamp('effectiveTo');

    t.index('organizationId');
    t.index('policyCode');
    t.index('domain');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('compliancePolicyRule');
};
