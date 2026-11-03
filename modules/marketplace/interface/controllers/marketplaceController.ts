import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { ManageVendorUseCase } from '../../application/useCases/ManageVendor';
import { ManageCommissionRuleUseCase } from '../../application/useCases/ManageCommissionRule';
import { ManagePayoutUseCase } from '../../application/useCases/ManagePayout';
import { VendorTier } from '../../domain/entities/Vendor';
import { PayoutMethod } from '../../domain/entities/VendorPayout';
import {
  VendorNotFoundError,
  VendorAlreadyExistsError,
  VendorStatusError,
  CommissionRuleNotFoundError,
  CommissionValidationError,
  PayoutNotFoundError,
  PayoutStatusError,
  MarketplaceValidationError,
} from '../../domain/errors/MarketplaceErrors';
import { logCaughtError } from '../../../../libs/errors';

export class MarketplaceController {
  private vendorUseCase: ManageVendorUseCase;
  private commissionUseCase: ManageCommissionRuleUseCase;
  private payoutUseCase: ManagePayoutUseCase;

  constructor(vendorUseCase: ManageVendorUseCase, commissionUseCase: ManageCommissionRuleUseCase, payoutUseCase: ManagePayoutUseCase) {
    this.vendorUseCase = vendorUseCase;
    this.commissionUseCase = commissionUseCase;
    this.payoutUseCase = payoutUseCase;
  }

  private handleError = (res: HttpResponse, error: unknown): void => {
    if (error instanceof VendorNotFoundError || error instanceof CommissionRuleNotFoundError || error instanceof PayoutNotFoundError) {
      jsonResponse(res, 404, { success: false, error: error.message, code: error.code });
    } else if (error instanceof VendorAlreadyExistsError || error instanceof VendorStatusError || error instanceof PayoutStatusError) {
      jsonResponse(res, 409, { success: false, error: error.message, code: error.code });
    } else if (error instanceof CommissionValidationError || error instanceof MarketplaceValidationError) {
      jsonResponse(res, 400, { success: false, error: error.message, code: error.code });
    } else {
      logCaughtError('Marketplace controller error', error);
      jsonResponse(res, 500, { success: false, error: 'Internal error' });
    }
  };

  private getOrgId = (req: HttpRequest): string => {
    return (
      (req as unknown as { user?: { organizationId?: string; id?: string } }).user?.organizationId ??
      (req as unknown as { user?: { id?: string } }).user?.id ??
      ''
    );
  };

  // ─── Vendor endpoints ───

  listVendors = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const { status } = req.query as { status?: string };
    const vendors = status
      ? await this.vendorUseCase.listByStatus(status, organizationId)
      : await this.vendorUseCase.listByOrganization(organizationId);
    jsonResponse(res, 200, { success: true, data: vendors.map(v => v.toJSON()) });
  };

  getVendor = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.get(req.params.vendorId);
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  createVendor = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const vendor = await this.vendorUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<
      typeof this.vendorUseCase.create
    >[0]);
    jsonResponse(res, 201, { success: true, data: vendor.toJSON() });
  };

  updateVendor = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.updateProfile(
      req.params.vendorId,
      req.body as Parameters<typeof this.vendorUseCase.updateProfile>[1],
    );
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  setVendorAddress = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.setAddress(
      req.params.vendorId,
      req.body as Parameters<typeof this.vendorUseCase.setAddress>[1],
    );
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  setVendorBankInfo = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.setBankInfo(
      req.params.vendorId,
      req.body as Parameters<typeof this.vendorUseCase.setBankInfo>[1],
    );
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  approveVendor = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.approve(req.params.vendorId);
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  suspendVendor = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.suspend(req.params.vendorId);
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  terminateVendor = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.terminate(req.params.vendorId);
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  setVendorTier = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.setTier(req.params.vendorId, (req.body as Record<string, unknown>).tier as VendorTier);
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  setVendorCommissionRate = async (req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> => {
    const vendor = await this.vendorUseCase.setCommissionRate(
      req.params.vendorId,
      (req.body as Record<string, unknown>).commissionRate as number,
    );
    jsonResponse(res, 200, { success: true, data: vendor.toJSON() });
  };

  // ─── Commission rule endpoints ───

  listCommissionRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const { active, vendorId, categoryId } = req.query as { active?: string; vendorId?: string; categoryId?: string };
    let rules;
    if (active === 'true') {
      rules = await this.commissionUseCase.listActive(organizationId);
    } else if (vendorId) {
      rules = await this.commissionUseCase.listByVendor(vendorId, organizationId);
    } else if (categoryId) {
      rules = await this.commissionUseCase.listByCategory(categoryId, organizationId);
    } else {
      rules = await this.commissionUseCase.listByOrganization(organizationId);
    }
    jsonResponse(res, 200, { success: true, data: rules.map(r => r.toJSON()) });
  };

  getCommissionRule = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    const rule = await this.commissionUseCase.get(req.params.ruleId);
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  };

  createCommissionRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const body = req.body as Record<string, unknown>;
    // Default type and scope if not provided
    const payload = {
      ...body,
      type: body.type || 'percentage',
      scope: body.scope || 'global',
      organizationId,
    };
    const rule = await this.commissionUseCase.create(payload as Parameters<typeof this.commissionUseCase.create>[0]);
    jsonResponse(res, 201, { success: true, data: rule.toJSON() });
  };

  updateCommissionRate = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    const rule = await this.commissionUseCase.updateRate(req.params.ruleId, (req.body as Record<string, unknown>).rate as number);
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  };

  setCommissionPriority = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    const rule = await this.commissionUseCase.setPriority(req.params.ruleId, (req.body as Record<string, unknown>).priority as number);
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  };

  setCommissionValidity = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    const rule = await this.commissionUseCase.setValidity(
      req.params.ruleId,
      (req.body as Record<string, unknown>).startsAt as Date | undefined,
      (req.body as Record<string, unknown>).endsAt as Date | undefined,
    );
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  };

  activateCommissionRule = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    const rule = await this.commissionUseCase.activate(req.params.ruleId);
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  };

  deactivateCommissionRule = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    const rule = await this.commissionUseCase.deactivate(req.params.ruleId);
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  };

  deleteCommissionRule = async (req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> => {
    await this.commissionUseCase.delete(req.params.ruleId);
    jsonResponse(res, 200, { success: true });
  };

  calculateCommission = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const { vendorId, amountCents, categoryId, productId } = req.body as {
      vendorId: string;
      amountCents: number;
      categoryId?: string;
      productId?: string;
    };
    const commission = await this.commissionUseCase.calculateCommission(organizationId, vendorId, amountCents, categoryId, productId);
    jsonResponse(res, 200, { success: true, data: { commission } });
  };

  // ─── Payout endpoints ───

  listPayouts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const { vendorId, status } = req.query as { vendorId?: string; status?: string };
    let payouts;
    if (status && organizationId) {
      payouts = await this.payoutUseCase.listByStatus(status, organizationId);
    } else if (vendorId) {
      payouts = await this.payoutUseCase.listByVendor(vendorId);
    } else {
      payouts = await this.payoutUseCase.listByOrganization(organizationId);
    }
    jsonResponse(res, 200, { success: true, data: payouts.map(p => p.toJSON()) });
  };

  getPayout = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.get(req.params.payoutId);
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  createPayout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const organizationId = this.getOrgId(req);
    const body = req.body as Record<string, unknown>;
    // Map simple payload (amountCents, currency) to full use case input
    const amountCents = typeof body.amountCents === 'number' ? body.amountCents : Number(body.amountCents) || 0;
    const currency = (body.currency as string) || 'USD';
    const method = (body.method as string) || 'bank_transfer';
    const now = new Date();
    const periodEnd = body.periodEnd ? new Date(body.periodEnd as string) : now;
    const periodStart = body.periodStart ? new Date(body.periodStart as string) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lineItems = Array.isArray(body.lineItems)
      ? body.lineItems
      : [
          {
            lineItemId: `li-${Date.now()}`,
            orderId: (body.orderId as string) || null,
            orderNumber: (body.orderNumber as string) || null,
            grossRevenueCents: amountCents,
            commissionAmountCents: 0,
            netAmountCents: amountCents,
            currency,
          },
        ];
    const payout = await this.payoutUseCase.create({
      vendorId: body.vendorId as string,
      organizationId,
      method: method as never,
      periodStart,
      periodEnd,
      currency,
      lineItems: lineItems as never,
    });
    jsonResponse(res, 201, { success: true, data: payout.toJSON() });
  };

  addPayoutLineItem = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.addLineItem(
      req.params.payoutId,
      req.body as Parameters<typeof this.payoutUseCase.addLineItem>[1],
    );
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  processPayout = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.startProcessing(req.params.payoutId);
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  completePayout = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.complete(
      req.params.payoutId,
      (req.body as Record<string, unknown>).transactionRef as string | undefined,
    );
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  failPayout = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.fail(req.params.payoutId, (req.body as Record<string, unknown>).reason as string);
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  retryPayout = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.retry(req.params.payoutId);
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  cancelPayout = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.cancel(req.params.payoutId);
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };

  setPayoutMethod = async (req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> => {
    const payout = await this.payoutUseCase.setMethod(req.params.payoutId, (req.body as Record<string, unknown>).method as PayoutMethod);
    jsonResponse(res, 200, { success: true, data: payout.toJSON() });
  };
}
