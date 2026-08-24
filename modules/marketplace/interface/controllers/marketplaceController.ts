import { Response } from 'express';
import { TypedRequest } from '../../../../libs/types/express';
import { logger } from '../../../../libs/logger';
import {
  ManageVendorUseCase,
  ManageCommissionRuleUseCase,
  ManagePayoutUseCase,
} from '../../application/useCases/Marketplace';
import {
  VendorRepository,
  CommissionRuleRepository,
  VendorPayoutRepository,
} from '../../domain/repositories/MarketplaceRepository';
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

  constructor(
    vendorRepo: VendorRepository,
    commissionRepo: CommissionRuleRepository,
    payoutRepo: VendorPayoutRepository,
  ) {
    this.vendorUseCase = new ManageVendorUseCase(vendorRepo);
    this.commissionUseCase = new ManageCommissionRuleUseCase(commissionRepo, vendorRepo);
    this.payoutUseCase = new ManagePayoutUseCase(payoutRepo, vendorRepo);
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof VendorNotFoundError || error instanceof CommissionRuleNotFoundError ||
        error instanceof PayoutNotFoundError) {
      res.status(404).json({ success: false, error: error.message, code: error.code });
    } else if (error instanceof VendorAlreadyExistsError || error instanceof VendorStatusError ||
               error instanceof PayoutStatusError) {
      res.status(409).json({ success: false, error: error.message, code: error.code });
    } else if (error instanceof CommissionValidationError || error instanceof MarketplaceValidationError) {
      res.status(400).json({ success: false, error: error.message, code: error.code });
    } else {
      logger.error('Marketplace controller error', { error: (error as Error).message, stack: (error as Error).stack });
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }

  private getOrgId(req: TypedRequest): string {
    return (req as unknown as { user?: { organizationId?: string } }).user?.organizationId ?? '';
  }

  // ─── Vendor endpoints ───

  async listVendors(req: TypedRequest, res: Response): Promise<void> {
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

  async getVendor(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.get(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createVendor(req: TypedRequest, res: Response): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const vendor = await this.vendorUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<typeof this.vendorUseCase.create>[0]);
      res.status(201).json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateVendor(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.updateProfile(req.params.vendorId, req.body as Parameters<typeof this.vendorUseCase.updateProfile>[1]);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorAddress(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setAddress(req.params.vendorId, req.body as Parameters<typeof this.vendorUseCase.setAddress>[1]);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorBankInfo(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setBankInfo(req.params.vendorId, req.body as Parameters<typeof this.vendorUseCase.setBankInfo>[1]);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async approveVendor(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.approve(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async suspendVendor(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.suspend(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async terminateVendor(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.terminate(req.params.vendorId);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorTier(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setTier(req.params.vendorId, (req.body as Record<string, unknown>).tier as VendorTier);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setVendorCommissionRate(req: TypedRequest<{ vendorId: string }>, res: Response): Promise<void> {
    try {
      const vendor = await this.vendorUseCase.setCommissionRate(req.params.vendorId, (req.body as Record<string, unknown>).commissionRate as number);
      res.json({ success: true, data: vendor.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── Commission rule endpoints ───

  async listCommissionRules(req: TypedRequest, res: Response): Promise<void> {
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

  async getCommissionRule(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await this.commissionUseCase.get(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createCommissionRule(req: TypedRequest, res: Response): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const rule = await this.commissionUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<typeof this.commissionUseCase.create>[0]);
      res.status(201).json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateCommissionRate(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await this.commissionUseCase.updateRate(req.params.ruleId, (req.body as Record<string, unknown>).rate as number);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setCommissionPriority(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await this.commissionUseCase.setPriority(req.params.ruleId, (req.body as Record<string, unknown>).priority as number);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setCommissionValidity(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await this.commissionUseCase.setValidity(req.params.ruleId, (req.body as Record<string, unknown>).startsAt as Date | undefined, (req.body as Record<string, unknown>).endsAt as Date | undefined);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async activateCommissionRule(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await this.commissionUseCase.activate(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deactivateCommissionRule(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await this.commissionUseCase.deactivate(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deleteCommissionRule(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      await this.commissionUseCase.delete(req.params.ruleId);
      res.json({ success: true });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async calculateCommission(req: TypedRequest, res: Response): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const { vendorId, amount, categoryId, productId } = req.body as { vendorId: string; amount: number; categoryId?: string; productId?: string };
      const commission = await this.commissionUseCase.calculateCommission(organizationId, vendorId, amount, categoryId, productId);
      res.json({ success: true, data: { commission } });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  // ─── Payout endpoints ───

  async listPayouts(req: TypedRequest, res: Response): Promise<void> {
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

  async getPayout(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.get(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createPayout(req: TypedRequest, res: Response): Promise<void> {
    try {
      const organizationId = this.getOrgId(req);
      const payout = await this.payoutUseCase.create({ ...(req.body as Record<string, unknown>), organizationId } as Parameters<typeof this.payoutUseCase.create>[0]);
      res.status(201).json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async addPayoutLineItem(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.addLineItem(req.params.payoutId, req.body as Parameters<typeof this.payoutUseCase.addLineItem>[1]);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async processPayout(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.startProcessing(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async completePayout(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.complete(req.params.payoutId, (req.body as Record<string, unknown>).transactionRef as string | undefined);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async failPayout(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.fail(req.params.payoutId, (req.body as Record<string, unknown>).reason as string);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async retryPayout(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.retry(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async cancelPayout(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.cancel(req.params.payoutId);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async setPayoutMethod(req: TypedRequest<{ payoutId: string }>, res: Response): Promise<void> {
    try {
      const payout = await this.payoutUseCase.setMethod(req.params.payoutId, (req.body as Record<string, unknown>).method as PayoutMethod);
      res.json({ success: true, data: payout.toJSON() });
    } catch (error) {
      this.handleError(res, error);
    }
  }
}
