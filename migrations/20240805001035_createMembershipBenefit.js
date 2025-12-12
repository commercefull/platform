/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipBenefit', t => {
    t.uuid('membershipBenefitId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.string('shortDescription', 255);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.enum('benefitType', ['discount', 'freeShipping', 'contentAccess', 'prioritySupport', 'rewardPoints', 'gift', 'earlyAccess', 'custom']).notNullable();
    t.enum('valueType', ['fixed', 'percentage', 'boolean', 'text', 'json']).notNullable().defaultTo('fixed');
    t.jsonb('value');
    t.text('icon');
    t.jsonb('rules');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('code');
    t.index('isActive');
    t.index('priority');
    t.index('benefitType');
    t.index('valueType');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipBenefit');
};
