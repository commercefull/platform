import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManagePaymentGatewaysUseCase } from '../../../modules/payment/application/useCases/ManagePaymentGateways';
import { ManagePaymentDisputesUseCase } from '../../../modules/payment/application/useCases/ManagePaymentDisputes';
import { ManagePaymentFeesUseCase } from '../../../modules/payment/application/useCases/ManagePaymentFees';
import { ManagePaymentSettingsUseCase } from '../../../modules/payment/application/useCases/ManagePaymentSettings';
import { GetPaymentBalancesUseCase } from '../../../modules/payment/application/useCases/GetPaymentBalances';
import { ManagePaymentReportsUseCase } from '../../../modules/payment/application/useCases/ManagePaymentReports';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';

const managePaymentGatewaysUseCase = new ManagePaymentGatewaysUseCase();
const managePaymentDisputesUseCase = new ManagePaymentDisputesUseCase();
const managePaymentFeesUseCase = new ManagePaymentFeesUseCase();
const managePaymentSettingsUseCase = new ManagePaymentSettingsUseCase();
const getPaymentBalancesUseCase = new GetPaymentBalancesUseCase();
const managePaymentReportsUseCase = new ManagePaymentReportsUseCase();

// ============================================================================
// Payment Gateways
// ============================================================================

export const listPaymentGateways = async (req: TypedRequest, res: Response): Promise<void> => {
  // For now, we'll use a default organization ID. In a real app, this would come from the authenticated user
  const organizationId = 'default-organization';

  const gateways = await managePaymentGatewaysUseCase.findAll(organizationId);

  adminRespond(req, res, 'payments/gateways/index', {
    pageName: 'Payment Gateways',
    gateways,

    success: req.query.success || null,
  });
  
};

export const createPaymentGatewayForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'payments/gateways/create', {
    pageName: 'Create Payment Gateway',
  });
  
};

export const createPaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const organizationId = 'default-organization';
    const body = req.body as RequestBody;
    const { name, provider, isActive, isDefault, isTestMode, apiKey, apiSecret, publicKey, webhookSecret, apiEndpoint } = body;

    const gateway = await managePaymentGatewaysUseCase.create({
      organizationId,
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
      supportedPaymentMethods: JSON.stringify(['credit_card', 'debit_card', 'paypal']),
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      processingFees: { percentage: 2.9, fixed: 0.3 },
      metadata: {},
      checkoutSettings: {},
    });

    res.redirect(`/hub/payments/gateways/${gateway.paymentGatewayId}?success=Payment gateway created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'payments/gateways/create', {
      pageName: 'Create Payment Gateway',
      error: (error as Error).message || 'Failed to create payment gateway',
      formData: req.body as RequestBody,
    });
  }
};

export const viewPaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  const { gatewayId } = req.params;

  const gateway = await managePaymentGatewaysUseCase.findById(gatewayId);

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
  
};

export const editPaymentGatewayForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { gatewayId } = req.params;

  const gateway = await managePaymentGatewaysUseCase.findById(gatewayId);

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
  
};

export const updatePaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  const { gatewayId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const { name, provider, isActive, isDefault, isTestMode, apiKey, apiSecret, publicKey, webhookSecret, apiEndpoint } = body;

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

  const _gateway = await managePaymentGatewaysUseCase.update(gatewayId, updates);

  res.redirect(`/hub/payments/gateways/${gatewayId}?success=Payment gateway updated successfully`);
  
};

export const deletePaymentGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  const { gatewayId } = req.params;

  const success = await managePaymentGatewaysUseCase.delete(gatewayId);

  if (!success) {
    throw new Error('Failed to delete payment gateway');
  }

  res.json({ success: true, message: 'Payment gateway deleted successfully' });
  
};

// ============================================================================
// Payment Methods
// ============================================================================

export const listPaymentMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  const organizationId = 'default-organization';

  const methods = await managePaymentGatewaysUseCase.findAllMethodConfigs(organizationId);

  adminRespond(req, res, 'payments/methods/index', {
    pageName: 'Payment Methods',
    methods,

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Payment Transactions
// ============================================================================

export const listPaymentTransactions = async (req: TypedRequest, res: Response): Promise<void> => {
  // For demonstration, we'll get recent transactions
  // In a real app, you'd implement pagination and filtering
  const transactions: unknown[] = []; // Would fetch from repository

  adminRespond(req, res, 'payments/transactions/index', {
    pageName: 'Payment Transactions',
    transactions,

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Payment Disputes
// ============================================================================

export const listDisputes = async (req: TypedRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const allDisputes = await managePaymentDisputesUseCase.findAll(status as string | undefined, 100);

  adminRespond(req, res, 'payments/disputes/index', {
    pageName: 'Payment Disputes',
    disputes: allDisputes,
    filters: { status: status || '' },
    success: req.query.success || null,
  });
  
};

export const viewDispute = async (req: TypedRequest, res: Response): Promise<void> => {
  const { disputeId } = req.params;
  const dispute = await managePaymentDisputesUseCase.findById(disputeId);

  if (!dispute) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Dispute not found' });
    return;
  }

  adminRespond(req, res, 'payments/disputes/detail', {
    pageName: `Dispute: ${dispute.paymentDisputeId.substring(0, 8)}`,
    dispute,
    success: req.query.success || null,
  });
  
};

export const updateDisputeStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { disputeId } = req.params;
    const body = req.body as RequestBody;
    const { status } = body;
    const resolvedAt = status === 'resolved' ? new Date() : undefined;

    await managePaymentDisputesUseCase.updateStatus(disputeId, status, resolvedAt);
    res.redirect(`/admin/payments/disputes/${disputeId}?success=Status updated`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/payments/disputes/${req.params.disputeId}?error=${encodeURIComponent((error as Error).message)}`);
  }
};

// ============================================================================
// Payment Fees
// ============================================================================

export const listPaymentFees = async (req: TypedRequest, res: Response): Promise<void> => {
  const fees = await managePaymentFeesUseCase.findAll(100);

  adminRespond(req, res, 'payments/fees/index', {
    pageName: 'Payment Fees',
    fees,
    success: req.query.success || null,
  });
  
};

// ============================================================================
// Payment Settings
// ============================================================================

export const listPaymentSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  const allSettings = await managePaymentSettingsUseCase.findAll();

  adminRespond(req, res, 'payments/settings/index', {
    pageName: 'Payment Settings',
    settings: allSettings,
    success: req.query.success || null,
  });
  
};

export const updatePaymentSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const body = req.body as RequestBody;
    const { provider, isEnabled, config } = body;

    await managePaymentSettingsUseCase.upsert({
      organizationId,
      provider,
      isEnabled: isEnabled === 'true' || isEnabled === true,
      config: config ? (typeof config === 'string' ? JSON.parse(config) : config) : {},
    });

    res.redirect(`/admin/payments/settings?success=Settings updated`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/payments/settings?error=${encodeURIComponent((error as Error).message)}`);
  }
};

// ============================================================================
// Payment Balance
// ============================================================================

export const viewPaymentBalance = async (req: TypedRequest, res: Response): Promise<void> => {
  const balances = await getPaymentBalancesUseCase.findAll();

  adminRespond(req, res, 'payments/balance/index', {
    pageName: 'Payment Balances',
    balances,
    success: req.query.success || null,
  });
  
};

// ============================================================================
// Payment Reports
// ============================================================================

export const listPaymentReports = async (req: TypedRequest, res: Response): Promise<void> => {
  const reports = await managePaymentReportsUseCase.findAll(100);

  adminRespond(req, res, 'payments/reports/index', {
    pageName: 'Payment Reports',
    reports,
    success: req.query.success || null,
  });
  
};

export const viewPaymentReport = async (req: TypedRequest, res: Response): Promise<void> => {
  const { reportId } = req.params;
  const report = await managePaymentReportsUseCase.findById(reportId);

  if (!report) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Report not found' });
    return;
  }

  adminRespond(req, res, 'payments/reports/detail', {
    pageName: `Report: ${report.type} (${new Date(report.periodStart).toLocaleDateString()})`,
    report,
    success: req.query.success || null,
  });
  
};
