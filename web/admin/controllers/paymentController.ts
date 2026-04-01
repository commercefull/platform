import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import PaymentRepo from '../../../modules/payment/infrastructure/repositories/paymentRepo';
import * as paymentDisputeRepo from '../../../modules/payment/infrastructure/repositories/paymentDisputeRepo';
import * as paymentFeeRepo from '../../../modules/payment/infrastructure/repositories/paymentFeeRepo';
import * as paymentSettingsRepo from '../../../modules/payment/infrastructure/repositories/paymentSettingsRepo';
import * as paymentBalanceRepo from '../../../modules/payment/infrastructure/repositories/paymentBalanceRepo';
import * as paymentReportRepo from '../../../modules/payment/infrastructure/repositories/paymentReportRepo';
import { query as dbQuery, queryOne as dbQueryOne  } from '../../../libs/db';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';

// ============================================================================
// Payment Gateways
// ============================================================================

export const listPaymentGateways = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // For now, we'll use a default merchant ID. In a real app, this would come from the authenticated user
    const merchantId = 'default-merchant';

    const gateways = await PaymentRepo.findAllGateways(merchantId);

    adminRespond(req, res, 'payments/gateways/index', {
      pageName: 'Payment Gateways',
      gateways,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment gateways',
    });
  }
};

export const createPaymentGatewayForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'payments/gateways/create', {
      pageName: 'Create Payment Gateway',
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createPaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = 'default-merchant';
    const { name, provider, isActive, isDefault, isTestMode, apiKey, apiSecret, publicKey, webhookSecret, apiEndpoint } = req.body;

    const gateway = await PaymentRepo.createGateway({
      merchantId,
      name,
      provider,
      isActive: isActive === 'true' || isActive === true,
      isDefault: isDefault === 'true' || isDefault === true,
      isTestMode: isTestMode === 'true' || isTestMode === true,
      apiKey: apiKey || undefined,
      apiSecret: apiSecret || undefined,
      publicKey: publicKey || undefined,
      webhookSecret: webhookSecret || undefined,
      apiEndpoint: apiEndpoint || undefined,
      supportedPaymentMethods: ['credit_card', 'debit_card', 'paypal'] as any,
      supportedCurrencies: ['USD', 'EUR', 'GBP'] as any,
      processingFees: { percentage: 2.9, fixed: 0.3 } as any,
      metadata: {} as any,
      checkoutSettings: {} as any,
    });

    res.redirect(`/hub/payments/gateways/${gateway.paymentGatewayId}?success=Payment gateway created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'payments/gateways/create', {
      pageName: 'Create Payment Gateway',
      error: error.message || 'Failed to create payment gateway',
      formData: req.body,
    });
  }
};

export const viewPaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const gateway = await PaymentRepo.findGatewayById(gatewayId);

    if (!gateway) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Payment gateway not found',
      });
      return;
    }

    adminRespond(req, res, 'payments/gateways/view', {
      pageName: `Gateway: ${gateway.name}`,
      gateway,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment gateway',
    });
  }
};

export const editPaymentGatewayForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const gateway = await PaymentRepo.findGatewayById(gatewayId);

    if (!gateway) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Payment gateway not found',
      });
      return;
    }

    adminRespond(req, res, 'payments/gateways/edit', {
      pageName: `Edit: ${gateway.name}`,
      gateway,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updatePaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const updates: any = {};

    const { name, provider, isActive, isDefault, isTestMode, apiKey, apiSecret, publicKey, webhookSecret, apiEndpoint } = req.body;

    if (name !== undefined) updates.name = name;
    if (provider !== undefined) updates.provider = provider;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
    if (isDefault !== undefined) updates.isDefault = isDefault === 'true' || isDefault === true;
    if (isTestMode !== undefined) updates.isTestMode = isTestMode === 'true' || isTestMode === true;
    if (apiKey !== undefined) updates.apiKey = apiKey || undefined;
    if (apiSecret !== undefined) updates.apiSecret = apiSecret || undefined;
    if (publicKey !== undefined) updates.publicKey = publicKey || undefined;
    if (webhookSecret !== undefined) updates.webhookSecret = webhookSecret || undefined;
    if (apiEndpoint !== undefined) updates.apiEndpoint = apiEndpoint || undefined;

    const gateway = await PaymentRepo.updateGateway(gatewayId, updates);

    res.redirect(`/hub/payments/gateways/${gatewayId}?success=Payment gateway updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const gateway = await PaymentRepo.findGatewayById(req.params.gatewayId);

      adminRespond(req, res, 'payments/gateways/edit', {
        pageName: `Edit: ${gateway?.name || 'Gateway'}`,
        gateway,
        error: error.message || 'Failed to update payment gateway',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update payment gateway',
      });
    }
  }
};

export const deletePaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const success = await PaymentRepo.deleteGateway(gatewayId);

    if (!success) {
      throw new Error('Failed to delete payment gateway');
    }

    res.json({ success: true, message: 'Payment gateway deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete payment gateway' });
  }
};

// ============================================================================
// Payment Methods
// ============================================================================

export const listPaymentMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = 'default-merchant';

    const methods = await PaymentRepo.findAllMethodConfigs(merchantId);

    adminRespond(req, res, 'payments/methods/index', {
      pageName: 'Payment Methods',
      methods,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment methods',
    });
  }
};

// ============================================================================
// Payment Transactions
// ============================================================================

export const listPaymentTransactions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // For demonstration, we'll get recent transactions
    // In a real app, you'd implement pagination and filtering
    const transactions: any[] = []; // Would fetch from repository

    adminRespond(req, res, 'payments/transactions/index', {
      pageName: 'Payment Transactions',
      transactions,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment transactions',
    });
  }
};

// ============================================================================
// Payment Disputes
// ============================================================================

export const listDisputes = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const disputes = await paymentDisputeRepo.findByPayment('');
    // Fetch all disputes across all payments via a broader query
    const allDisputes = await (async () => {
      const rows = await dbQuery<paymentDisputeRepo.PaymentDispute[]>(
        `SELECT * FROM "paymentDispute" ${status ? `WHERE status = $1` : ''} ORDER BY "createdAt" DESC LIMIT 100`,
        status ? [status as string] : [],
      );
      return rows || [];
    })();

    adminRespond(req, res, 'payments/disputes/index', {
      pageName: 'Payment Disputes',
      disputes: allDisputes,
      filters: { status: status || '' },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load disputes' });
  }
};

export const viewDispute = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { disputeId } = req.params;
    const dispute = await paymentDisputeRepo.findById(disputeId);

    if (!dispute) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Dispute not found' });
      return;
    }

    adminRespond(req, res, 'payments/disputes/detail', {
      pageName: `Dispute: ${dispute.paymentDisputeId.substring(0, 8)}`,
      dispute,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load dispute' });
  }
};

export const updateDisputeStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { disputeId } = req.params;
    const { status } = req.body;
    const resolvedAt = status === 'resolved' ? new Date() : undefined;

    await paymentDisputeRepo.updateStatus(disputeId, status, resolvedAt);
    res.redirect(`/admin/payments/disputes/${disputeId}?success=Status updated`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/payments/disputes/${req.params.disputeId}?error=${encodeURIComponent(error.message)}`);
  }
};

// ============================================================================
// Payment Fees
// ============================================================================

export const listPaymentFees = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const fees = await (async () => {
      const rows = await dbQuery<paymentFeeRepo.PaymentFee[]>(
        `SELECT * FROM "paymentFee" ORDER BY "createdAt" DESC LIMIT 100`,
        [],
      );
      return rows || [];
    })();

    adminRespond(req, res, 'payments/fees/index', {
      pageName: 'Payment Fees',
      fees,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load fees' });
  }
};

// ============================================================================
// Payment Settings
// ============================================================================

export const listPaymentSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const allSettings = await dbQuery<paymentSettingsRepo.PaymentSettings[]>(
      `SELECT * FROM "paymentSettings" ORDER BY "createdAt" DESC`,
      [],
    );

    adminRespond(req, res, 'payments/settings/index', {
      pageName: 'Payment Settings',
      settings: allSettings || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load settings' });
  }
};

export const updatePaymentSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const { provider, isEnabled, config } = req.body;

    await paymentSettingsRepo.upsert({
      merchantId,
      provider,
      isEnabled: isEnabled === 'true' || isEnabled === true,
      config: config ? (typeof config === 'string' ? JSON.parse(config) : config) : {},
    });

    res.redirect(`/admin/payments/settings?success=Settings updated`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/payments/settings?error=${encodeURIComponent(error.message)}`);
  }
};

// ============================================================================
// Payment Balance
// ============================================================================

export const viewPaymentBalance = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const balances = await dbQuery<paymentBalanceRepo.PaymentBalance[]>(
      `SELECT * FROM "paymentBalance" ORDER BY "merchantId", currency`,
      [],
    );

    adminRespond(req, res, 'payments/balance/index', {
      pageName: 'Payment Balances',
      balances: balances || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load balances' });
  }
};

// ============================================================================
// Payment Reports
// ============================================================================

export const listPaymentReports = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const reports = await dbQuery<paymentReportRepo.PaymentReport[]>(
      `SELECT * FROM "paymentReport" ORDER BY "periodStart" DESC LIMIT 100`,
      [],
    );

    adminRespond(req, res, 'payments/reports/index', {
      pageName: 'Payment Reports',
      reports: reports || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load reports' });
  }
};

export const viewPaymentReport = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const report = await dbQueryOne<paymentReportRepo.PaymentReport>(
      `SELECT * FROM "paymentReport" WHERE "paymentReportId" = $1`,
      [reportId],
    );

    if (!report) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Report not found' });
      return;
    }

    adminRespond(req, res, 'payments/reports/detail', {
      pageName: `Report: ${report.type} (${new Date(report.periodStart).toLocaleDateString()})`,
      report,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load report' });
  }
};
