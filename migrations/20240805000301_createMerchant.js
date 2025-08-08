/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchant', t => {
    t.uuid('merchantId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('slug', 150).notNullable().unique();
    t.text('description');
    t.string('email', 255).notNullable().unique();
    t.string('phone', 30);
    t.string('password', 255).notNullable();
    t.string('website', 255);
    t.text('logo');
    t.text('bannerImage');
    t.enum('status', ['pending', 'active', 'suspended', 'inactive', 'rejected']).notNullable().defaultTo('pending');
    t.enum('verificationStatus', ['unverified', 'inProgress', 'verified', 'rejected']).notNullable().defaultTo('unverified');
    t.timestamp('verifiedAt');
    t.uuid('verifiedBy');
    t.text('verificationNotes');
    t.enum('businessType', ['individual', 'soleProprietorship', 'partnership', 'llc', 'corporation', 'nonProfit']);
    t.integer('yearEstablished');
    t.integer('employeeCount');
    t.string('taxIdNumber', 50);
    t.string('legalName', 100);
    t.jsonb('socialLinks');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.text('metaKeywords');
    t.decimal('commissionRate', 5, 2);
    t.enum('commissionType', ['percentage', 'flat', 'tiered']).defaultTo('percentage');
    t.jsonb('commissionTiers');
    t.decimal('minimumPayoutAmount', 10, 2).defaultTo(50.00);
    t.enum('payoutSchedule', ['weekly', 'biweekly', 'monthly', 'quarterly']).defaultTo('monthly');
    t.boolean('autoApproveProducts').notNullable().defaultTo(false);
    t.boolean('autoApproveReviews').notNullable().defaultTo(false);
    t.decimal('sellerRating', 3, 2);
    t.boolean('featuredMerchant').notNullable().defaultTo(false);
    t.jsonb('storePolicies');
    t.jsonb('notificationPreferences');
    t.specificType('allowedCategories', 'uuid[]');
    t.text('notes');
    t.jsonb('customFields');
    
    t.timestamp('lastLoginAt');
    t.boolean('emailVerified').notNullable().defaultTo(false);
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('name');
    t.index('status');
    t.index('verificationStatus');
    t.index('businessType');
    t.index('commissionRate');
    t.index('featuredMerchant');
    t.index('sellerRating');
    t.index('lastLoginAt');
    t.index('createdAt');
    t.index('allowedCategories', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchant');
};
