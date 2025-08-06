/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('customer', t => {
      t.uuid('customerId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('deletedAt');
      t.string('email', 255).notNullable().unique();
      t.string('firstName', 100);
      t.string('lastName', 100);
      t.string('password', 255).notNullable();
      t.string('phone', 30);
      t.date('dateOfBirth');
      t.string('gender', 20);
      t.text('avatarUrl');
      t.boolean('isActive').notNullable().defaultTo(true);
      t.boolean('isVerified').notNullable().defaultTo(false);
      t.boolean('emailVerified').notNullable().defaultTo(false);
      t.boolean('phoneVerified').notNullable().defaultTo(false);
      t.timestamp('lastLoginAt');
      t.integer('failedLoginAttempts').notNullable().defaultTo(0);
      t.timestamp('lockedUntil');
      t.uuid('preferredLocaleId').references('id').inTable('locale');
      t.uuid('preferredCurrencyId').references('id').inTable('currency');
      t.string('timezone', 50);
      t.string('referralSource', 100);
      t.string('referralCode', 50);
      t.uuid('referredBy').references('id').inTable('customer');
      t.boolean('acceptsMarketing').notNullable().defaultTo(false);
      t.jsonb('marketingPreferences');
      t.jsonb('metadata');
      t.specificType('tags', 'text[]');
      t.text('note');
      t.string('externalId', 100);
      t.string('externalSource', 50);
      t.boolean('taxExempt').notNullable().defaultTo(false);
      t.string('taxExemptionCertificate', 100);
      t.string('passwordResetToken', 255);
      t.timestamp('passwordResetExpires');
      t.string('verificationToken', 255);
      t.boolean('agreeToTerms').notNullable().defaultTo(false);
      t.boolean('emailVerified').notNullable().defaultTo(false);
      t.index('phone');
      t.index('lastLoginAt');
      t.index('isActive');
      t.index('isVerified');
      t.index('emailVerified');
      t.index('tags', null, 'gin');
      t.index('externalId');
      t.index('createdAt');
      t.index('deletedAt');
    })
    .then(() => {
      return knex.schema.raw('CREATE UNIQUE INDEX customer_referral_code_unique_index ON customer ("referralCode") WHERE "referralCode" IS NOT NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customer');
};
