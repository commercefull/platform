/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('user', t => {
    t.uuid('userId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('email', 255).notNullable().unique();
    t.string('passwordHash', 255).notNullable();
    t.enum('userType', ['admin', 'super_admin']).notNullable().defaultTo('admin');
    t.enum('status', ['active', 'inactive', 'suspended']).notNullable().defaultTo('active');

    // Personal info
    t.string('firstName', 100);
    t.string('lastName', 100);
    t.string('phone', 20);

    // Verification
    t.boolean('emailVerified').notNullable().defaultTo(false);
    t.boolean('phoneVerified').notNullable().defaultTo(false);
    t.boolean('mfaEnabled').notNullable().defaultTo(false);
    t.string('mfaSecret');

    // Security tracking
    t.integer('loginCount').notNullable().defaultTo(0);
    t.integer('failedLoginAttempts').notNullable().defaultTo(0);
    t.timestamp('lastLoginAt', { useTz: true });
    t.timestamp('lockedUntil', { useTz: true });

    // Audit
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Indexes
    t.index(['email']);
    t.index(['userType']);
    t.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('user');
};
