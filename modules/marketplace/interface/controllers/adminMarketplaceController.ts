/**
 * Marketplace Admin UI Controller
 * Admin views for vendors, commission rules, and payouts
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { manageVendorUseCase, manageCommissionRuleUseCase, managePayoutUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

const getOrgId = (req: TypedRequest): string => (req as unknown as { user?: { organizationId?: string } }).user?.organizationId ?? '';

export const listVendors = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = getOrgId(req);
  const { status } = req.query as { status?: string };
  const vendors = status
    ? await manageVendorUseCase.listByStatus(status, organizationId)
    : await manageVendorUseCase.listByOrganization(organizationId);

  adminRespond(req, res, 'marketplace/vendors/index', {
    pageName: 'Marketplace Vendors',
    vendors: vendors.map(v => v.toJSON()),
    filterStatus: status || '',
    success: req.query.success || null,
  });
};

export const viewVendor = async (req: TypedRequest, res: Response): Promise<void> => {
  const { vendorId } = req.params;
  const vendor = await manageVendorUseCase.get(vendorId);

  if (!vendor) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Vendor not found' });
    return;
  }

  adminRespond(req, res, 'marketplace/vendors/view', {
    pageName: `Vendor: ${vendor.name}`,
    vendor: vendor.toJSON(),
    success: req.query.success || null,
  });
};

export const createVendorForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'marketplace/vendors/create', { pageName: 'Create Vendor' });
};

export const createVendor = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = getOrgId(req);
  const body = req.body as RequestBody;
  const vendor = await manageVendorUseCase.create({
    ...(body as Record<string, unknown>),
    organizationId,
  } as Parameters<typeof manageVendorUseCase.create>[0]);

  res.redirect(`/admin/marketplace/vendors/${vendor.vendorId}?success=Vendor created successfully`);
};

export const editVendorForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { vendorId } = req.params;
  const vendor = await manageVendorUseCase.get(vendorId);

  if (!vendor) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Vendor not found' });
    return;
  }

  adminRespond(req, res, 'marketplace/vendors/edit', {
    pageName: `Edit: ${vendor.name}`,
    vendor: vendor.toJSON(),
  });
};

export const updateVendor = async (req: TypedRequest, res: Response): Promise<void> => {
  const { vendorId } = req.params;
  const body = req.body as RequestBody;
  await manageVendorUseCase.updateProfile(vendorId, body as Parameters<typeof manageVendorUseCase.updateProfile>[1]);
  res.redirect(`/admin/marketplace/vendors/${vendorId}?success=Vendor updated successfully`);
};

export const approveVendor = async (req: TypedRequest, res: Response): Promise<void> => {
  const { vendorId } = req.params;
  await manageVendorUseCase.approve(vendorId);
  res.redirect(`/admin/marketplace/vendors/${vendorId}?success=Vendor approved`);
};

export const suspendVendor = async (req: TypedRequest, res: Response): Promise<void> => {
  const { vendorId } = req.params;
  await manageVendorUseCase.suspend(vendorId);
  res.redirect(`/admin/marketplace/vendors/${vendorId}?success=Vendor suspended`);
};

export const listCommissionRules = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = getOrgId(req);
  const rules = await manageCommissionRuleUseCase.listByOrganization(organizationId);

  adminRespond(req, res, 'marketplace/commissions/index', {
    pageName: 'Commission Rules',
    rules: rules.map(r => r.toJSON()),
    success: req.query.success || null,
  });
};

export const viewCommissionRule = async (req: TypedRequest, res: Response): Promise<void> => {
  const { ruleId } = req.params;
  const rule = await manageCommissionRuleUseCase.get(ruleId);

  if (!rule) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Commission rule not found' });
    return;
  }

  adminRespond(req, res, 'marketplace/commissions/view', {
    pageName: 'Commission Rule',
    rule: rule.toJSON(),
    success: req.query.success || null,
  });
};

export const listPayouts = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = getOrgId(req);
  const { vendorId, status } = req.query as { vendorId?: string; status?: string };

  let payouts;
  if (status && organizationId) {
    payouts = await managePayoutUseCase.listByStatus(status, organizationId);
  } else if (vendorId) {
    payouts = await managePayoutUseCase.listByVendor(vendorId);
  } else {
    payouts = await managePayoutUseCase.listByOrganization(organizationId);
  }

  adminRespond(req, res, 'marketplace/payouts/index', {
    pageName: 'Vendor Payouts',
    payouts: payouts.map(p => p.toJSON()),
    filters: { vendorId: vendorId || '', status: status || '' },
    success: req.query.success || null,
  });
};

export const viewPayout = async (req: TypedRequest, res: Response): Promise<void> => {
  const { payoutId } = req.params;
  const payout = await managePayoutUseCase.get(payoutId);

  if (!payout) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Payout not found' });
    return;
  }

  adminRespond(req, res, 'marketplace/payouts/view', {
    pageName: 'Vendor Payout',
    payout: payout.toJSON(),
    success: req.query.success || null,
  });
};
