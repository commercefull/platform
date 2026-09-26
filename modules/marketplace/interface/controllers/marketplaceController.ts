import type { HttpRequest, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
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

export class MarketplaceController {
  private vendorUseCase: ManageVendorUseCase;
  private commissionUseCase: ManageCommissionRuleUseCase;
  private payoutUseCase: ManagePayoutUseCase;

  constructor(vendorUseCase: ManageVendorUseCase, commissionUseCase: ManageCommissionRuleUseCase, payoutUseCase: ManagePayoutUseCase) {
    this.vendorUseCase = vendorUseCase;
    this.commissionUseCase = commissionUseCase;
    this.payoutUseCase = payoutUseCase;
  }

  private handleError(res: HttpResponse, error: unknown): void {
    if (error instanceof VendorNotFoundError || error instanceof CommissionRuleNotFoundError || error instanceof PayoutNotFoundError) {
      res.status(404).json({ success: false, error: error.message, code: error.code });
    } else if (error instanceof VendorAlreadyExistsError || error instanceof VendorStatusError || error instanceof PayoutStatusError) {
      res.status(409).json({ success: false, error: error.message, code: error.code });
    } else if (error instanceof CommissionValidationError || error instanceof MarketplaceValidationError) {
      res.status(400).json({ success: false, error: error.message, code: error.code });
    } else {
      logger.error('Marketplace controller error', { error: (error as Error).message, stack: (error as Error).stack });
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }

  private getOrgId(req: HttpRequest): string {
    return (
      (req as unknown as { user?: { organizationId?: string; id?: string } }).user?.organizationId ??
      (req as unknown as { user?: { id?: string } }).user?.id ??
      ''
    );
  }

  // ─── Vendor endpoints ───

  async listVendors(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const { status } = req.query as { status?: string };
      const vendors = status
        ? await this.vendorUseCase.listByStatus(status, organizationId)
        : await this.vendorUseCase.listByOrganization(organizationId);
      res.json({ success: true, data: vendors.map(v => v.toJSON()) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getVendor(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.get(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createVendor(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const vendor = await this.vendorUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<
        typeof this.vendorUseCase.create
      >[0]);
      res.status(201).json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateVendor(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.updateProfile(
        req.params.vendorId,
        req.body as Parameters<typeof this.vendorUseCase.updateProfile>[1],
      );
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorAddress(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setAddress(
        req.params.vendorId,
        req.body as Parameters<typeof this.vendorUseCase.setAddress>[1],
      );
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorBankInfo(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setBankInfo(
        req.params.vendorId,
        req.body as Parameters<typeof this.vendorUseCase.setBankInfo>[1],
      );
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async approveVendor(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.approve(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async suspendVendor(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.suspend(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async terminateVendor(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.terminate(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorTier(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setTier(req.params.vendorId, (req.body as Record<string, unknown>).tier as VendorTier);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorCommissionRate(req: HttpRequest<{ vendorId: string }>, res: HttpResponse): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setCommissionRate(
        req.params.vendorId,
        (req.body as Record<string, unknown>).commissionRate as number,
      );
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── Commission rule endpoints ───

  async listCommissionRules(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
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
      res.json({ success: true, data: rules.map(r => r.toJSON()) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getCommissionRule(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      const rule = await this.commissionUseCase.get(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createCommissionRule(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
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
      res.status(201).json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateCommissionRate(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      const rule = await this.commissionUseCase.updateRate(req.params.ruleId, (req.body as Record<string, unknown>).rate as number);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setCommissionPriority(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      const rule = await this.commissionUseCase.setPriority(req.params.ruleId, (req.body as Record<string, unknown>).priority as number);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setCommissionValidity(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      const rule = await this.commissionUseCase.setValidity(
        req.params.ruleId,
        (req.body as Record<string, unknown>).startsAt as Date | undefined,
        (req.body as Record<string, unknown>).endsAt as Date | undefined,
      );
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async activateCommissionRule(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      const rule = await this.commissionUseCase.activate(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deactivateCommissionRule(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      const rule = await this.commissionUseCase.deactivate(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deleteCommissionRule(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    try {
      await this.commissionUseCase.delete(req.params.ruleId);
      res.json({ success: true });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async calculateCommission(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const { vendorId, amountCents, categoryId, productId } = req.body as {
        vendorId: string;
        amountCents: number;
        categoryId?: string;
        productId?: string;
      };
      const commission = await this.commissionUseCase.calculateCommission(organizationId, vendorId, amountCents, categoryId, productId);
      res.json({ success: true, data: { commission } });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── Payout endpoints ───

  async listPayouts(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
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
      res.json({ success: true, data: payouts.map(p => p.toJSON()) });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getPayout(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.get(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createPayout(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
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
      res.status(201).json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async addPayoutLineItem(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.addLineItem(
        req.params.payoutId,
        req.body as Parameters<typeof this.payoutUseCase.addLineItem>[1],
      );
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async processPayout(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.startProcessing(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async completePayout(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.complete(
        req.params.payoutId,
        (req.body as Record<string, unknown>).transactionRef as string | undefined,
      );
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async failPayout(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.fail(req.params.payoutId, (req.body as Record<string, unknown>).reason as string);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async retryPayout(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.retry(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async cancelPayout(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.cancel(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setPayoutMethod(req: HttpRequest<{ payoutId: string }>, res: HttpResponse): Promise<void> {
    try {
      const payout = await this.payoutUseCase.setMethod(req.params.payoutId, (req.body as Record<string, unknown>).method as PayoutMethod);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
