/**
 * Marketplace Ops Test Data Seed
 * Seeds vendors and payouts for marketplaceOps integration tests:
 * - a pending vendor for terminate
 * - approved vendors with pending payouts for line-items, complete, fail/retry
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';

const VENDOR_IDS = {
  TERMINATE: '01943000-0000-7000-8000-000000000001',
  PAYOUT_LINE_ITEMS: '01943000-0000-7000-8000-000000000002',
  PAYOUT_COMPLETE: '01943000-0000-7000-8000-000000000003',
  PAYOUT_FAIL_RETRY: '01943000-0000-7000-8000-000000000004',
};

const PAYOUT_IDS = {
  LINE_ITEMS: '01943001-0000-7000-8000-000000000001',
  COMPLETE: '01943001-0000-7000-8000-000000000002',
  FAIL_RETRY: '01943001-0000-7000-8000-000000000003',
};

exports.seed = async function (knex) {
  const hasVendor = await knex.schema.hasTable('marketplaceVendor');
  const hasPayout = await knex.schema.hasTable('marketplaceVendorPayout');
  if (!hasVendor) {
    return;
  }

  const now = new Date();
  const approvedAt = new Date(now.getTime() - 86400000);
  const periodStart = new Date(now.getTime() - 30 * 86400000);

  if (hasPayout) {
    await knex('marketplaceVendorPayout').whereIn('payoutId', Object.values(PAYOUT_IDS)).del();
  }
  await knex('marketplaceVendor').whereIn('vendorId', Object.values(VENDOR_IDS)).del();

  const baseVendor = {
    organizationId: ORGANIZATION_ID,
    tier: 'standard',
    commissionRate: 10.0,
    stats: JSON.stringify({}),
    createdAt: now,
    updatedAt: now,
  };

  await knex('marketplaceVendor').insert([
    { ...baseVendor, vendorId: VENDOR_IDS.TERMINATE, name: 'Ops Vendor Terminate', email: 'ops-vendor-terminate@example.com', status: 'approved', approvedAt },
    { ...baseVendor, vendorId: VENDOR_IDS.PAYOUT_LINE_ITEMS, name: 'Ops Vendor Line Items', email: 'ops-vendor-li@example.com', status: 'approved', approvedAt },
    { ...baseVendor, vendorId: VENDOR_IDS.PAYOUT_COMPLETE, name: 'Ops Vendor Complete', email: 'ops-vendor-complete@example.com', status: 'approved', approvedAt },
    { ...baseVendor, vendorId: VENDOR_IDS.PAYOUT_FAIL_RETRY, name: 'Ops Vendor Fail Retry', email: 'ops-vendor-fail@example.com', status: 'approved', approvedAt },
  ]);

  if (hasPayout) {
    const basePayout = {
      organizationId: ORGANIZATION_ID,
      status: 'pending',
      method: 'bank_transfer',
      periodStart,
      periodEnd: now,
      lineItems: JSON.stringify([]),
      grossAmount: 250.0,
      commissionAmount: 25.0,
      netAmount: 225.0,
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
    };

    await knex('marketplaceVendorPayout').insert([
      { ...basePayout, payoutId: PAYOUT_IDS.LINE_ITEMS, vendorId: VENDOR_IDS.PAYOUT_LINE_ITEMS, payoutNumber: 'PO-OPS-0001' },
      { ...basePayout, payoutId: PAYOUT_IDS.COMPLETE, vendorId: VENDOR_IDS.PAYOUT_COMPLETE, payoutNumber: 'PO-OPS-0002' },
      { ...basePayout, payoutId: PAYOUT_IDS.FAIL_RETRY, vendorId: VENDOR_IDS.PAYOUT_FAIL_RETRY, payoutNumber: 'PO-OPS-0003' },
    ]);
  }
};
