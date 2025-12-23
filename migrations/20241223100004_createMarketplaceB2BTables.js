/**
 * Migration: Create Marketplace & B2B Tables
 * Phase 4: Marketplace & B2B - Commission plans, payouts, payment terms, tax exemptions
 */

exports.up = async function (knex) {
  // Create commissionPlan table
  const hasCommissionPlan = await knex.schema.hasTable('commissionPlan');
  if (!hasCommissionPlan) {
    await knex.schema.createTable('commissionPlan', table => {
      table.string('commissionPlanId', 50).primary();
      table.string('organizationId', 50).notNullable();
      table.string('name', 255).notNullable();
      table.jsonb('rules').notNullable(); // { categoryRules: [...], fixedFees: [...] }
      table.boolean('isDefault').defaultTo(false);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.index('organizationId');
      table.index('isDefault');
    });
  }

  // Create sellerPolicy table
  const hasSellerPolicy = await knex.schema.hasTable('sellerPolicy');
  if (!hasSellerPolicy) {
    await knex.schema.createTable('sellerPolicy', table => {
      table.string('sellerPolicyId', 50).primary();
      table.string('sellerId', 50).notNullable();
      table.text('returnsPolicy').nullable();
      table.text('shippingPolicy').nullable();
      table.integer('slaDays').defaultTo(3);
      table.jsonb('customPolicies').defaultTo('{}');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.index('sellerId');
    });
  }

  // Create payout table
  const hasPayout = await knex.schema.hasTable('payout');
  if (!hasPayout) {
    await knex.schema.createTable('payout', table => {
      table.string('payoutId', 50).primary();
      table.string('sellerId', 50).notNullable();
      table.string('orderId', 50).nullable();
      table.string('settlementId', 50).nullable();
      table.decimal('grossAmount', 15, 2).notNullable();
      table.decimal('commissionAmount', 15, 2).notNullable();
      table.decimal('feeAmount', 15, 2).defaultTo(0);
      table.decimal('netAmount', 15, 2).notNullable();
      table.string('currency', 3).notNullable();
      table.string('status', 20).defaultTo('pending'); // 'pending', 'scheduled', 'processing', 'completed', 'failed'
      table.date('scheduledDate').nullable();
      table.timestamp('processedAt').nullable();
      table.string('paymentReference', 100).nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.index('sellerId');
      table.index('orderId');
      table.index('settlementId');
      table.index('status');
      table.index('scheduledDate');
    });
  }

  // Create paymentTerms table
  const hasPaymentTerms = await knex.schema.hasTable('paymentTerms');
  if (!hasPaymentTerms) {
    await knex.schema.createTable('paymentTerms', table => {
      table.string('paymentTermsId', 50).primary();
      table.string('organizationId', 50).notNullable();
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
  }

  // Create taxExemption table
  const hasTaxExemption = await knex.schema.hasTable('taxExemption');
  if (!hasTaxExemption) {
    await knex.schema.createTable('taxExemption', table => {
      table.string('taxExemptionId', 50).primary();
      table.string('accountId', 50).notNullable();
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
  }

  // Add fields to merchant table if not exists
  const hasMerchantType = await knex.schema.hasColumn('merchant', 'type');
  if (!hasMerchantType) {
    await knex.schema.alterTable('merchant', table => {
      table.string('type', 20).defaultTo('external'); // 'internal', 'external'
      table.string('commissionPlanId', 50).nullable();
    });
  }

  // Add fields to b2bCompany table if not exists
  const hasB2BCompanyOrgId = await knex.schema.hasColumn('b2bCompany', 'organizationId');
  if (!hasB2BCompanyOrgId) {
    await knex.schema.alterTable('b2bCompany', table => {
      table.string('organizationId', 50).nullable();
      table.string('paymentTermsId', 50).nullable();
      table.decimal('creditLimit', 15, 2).nullable();
      table.decimal('availableCredit', 15, 2).nullable();
    });
  }

  // Insert default payment terms
  const existingTerms = await knex('paymentTerms').first();
  if (!existingTerms) {
    await knex('paymentTerms').insert([
      {
        paymentTermsId: 'pt_due_on_receipt',
        organizationId: 'org_default',
        name: 'Due on Receipt',
        code: 'DUE_ON_RECEIPT',
        days: 0,
        isDefault: true,
      },
      {
        paymentTermsId: 'pt_net_15',
        organizationId: 'org_default',
        name: 'Net 15',
        code: 'NET_15',
        days: 15,
        isDefault: false,
      },
      {
        paymentTermsId: 'pt_net_30',
        organizationId: 'org_default',
        name: 'Net 30',
        code: 'NET_30',
        days: 30,
        isDefault: false,
      },
      {
        paymentTermsId: 'pt_net_60',
        organizationId: 'org_default',
        name: 'Net 60',
        code: 'NET_60',
        days: 60,
        isDefault: false,
      },
    ]);
  }
};

exports.down = async function (knex) {
  // Remove added columns from b2bCompany
  const hasB2BCompanyOrgId = await knex.schema.hasColumn('b2bCompany', 'organizationId');
  if (hasB2BCompanyOrgId) {
    await knex.schema.alterTable('b2bCompany', table => {
      table.dropColumn('organizationId');
      table.dropColumn('paymentTermsId');
      table.dropColumn('creditLimit');
      table.dropColumn('availableCredit');
    });
  }

  // Remove added columns from merchant
  const hasMerchantType = await knex.schema.hasColumn('merchant', 'type');
  if (hasMerchantType) {
    await knex.schema.alterTable('merchant', table => {
      table.dropColumn('type');
      table.dropColumn('commissionPlanId');
    });
  }

  // Remove tables
  await knex.schema.dropTableIfExists('taxExemption');
  await knex.schema.dropTableIfExists('paymentTerms');
  await knex.schema.dropTableIfExists('payout');
  await knex.schema.dropTableIfExists('sellerPolicy');
  await knex.schema.dropTableIfExists('commissionPlan');
};
