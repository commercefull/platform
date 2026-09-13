/**
 * Seed Fashion Tax Rates
 * Creates tax rates for UK (VAT 20%) and US (per-state sales tax).
 *
 * UK: 20% VAT on standard clothing, 5% on children's clothing (zero rate not used in fashion seeds)
 * US: Per-state sales tax (NY 8.625%, CA 9.5%, OR 0%, etc.)
 */

exports.seed = async function (knex) {
  const now = knex.fn.now();

  // Get tax categories
  const standardCat = await knex('taxCategory').where({ code: 'standard' }).first('taxCategoryId');
  const reducedCat = await knex('taxCategory').where({ code: 'reduced' }).first('taxCategoryId');
  const zeroCat = await knex('taxCategory').where({ code: 'zero' }).first('taxCategoryId');

  // Get tax zones
  const ukZone = await knex('taxZone').where({ code: 'uk' }).first('taxZoneId');
  const usZone = await knex('taxZone').where({ code: 'us' }).first('taxZoneId');

  // Clean up existing fashion tax rates (by name prefix)
  await knex('taxRate').where('name', 'like', 'Fashion %').del();

  const rates = [];

  // UK VAT — 20% standard rate on adult clothing
  if (standardCat && ukZone) {
    rates.push({
      taxCategoryId: standardCat.taxCategoryId,
      taxZoneId: ukZone.taxZoneId,
      name: 'Fashion UK VAT 20% (Standard)',
      rate: 20.0,
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: true, // UK prices are tax-inclusive
      isShippingTaxable: true,
      startDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // UK VAT — 5% reduced rate on children's clothing
  if (reducedCat && ukZone) {
    rates.push({
      taxCategoryId: reducedCat.taxCategoryId,
      taxZoneId: ukZone.taxZoneId,
      name: 'Fashion UK VAT 5% (Childrenswear)',
      rate: 5.0,
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: true,
      isShippingTaxable: false,
      startDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // US Sales Tax — standard rate per state (simplified)
  // We use a single US-wide rate as a fallback; per-state rates would need state-specific zones
  if (standardCat && usZone) {
    rates.push({
      taxCategoryId: standardCat.taxCategoryId,
      taxZoneId: usZone.taxZoneId,
      name: 'Fashion US Sales Tax (Standard)',
      rate: 8.625, // NY default
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: false, // US prices are tax-exclusive
      isShippingTaxable: false,
      startDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // US — Zero rate for Oregon (and other no-tax states)
  if (zeroCat && usZone) {
    rates.push({
      taxCategoryId: zeroCat.taxCategoryId,
      taxZoneId: usZone.taxZoneId,
      name: 'Fashion US Sales Tax (Zero — OR/MT/NH/DE)',
      rate: 0.0,
      type: 'percentage',
      priority: 0,
      isCompound: false,
      includeInPrice: false,
      isShippingTaxable: false,
      startDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (rates.length > 0) {
    await knex('taxRate').insert(rates);
  }

  console.log(`Seeded ${rates.length} fashion tax rates`);
};
