import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { ManagePaymentGatewaysUseCase } from '../../application/useCases/ManagePaymentGateways';
import { ManagePaymentDisputesUseCase } from '../../application/useCases/ManagePaymentDisputes';
import { ManagePaymentFeesUseCase } from '../../application/useCases/ManagePaymentFees';
import { ManagePaymentSettingsUseCase } from '../../application/useCases/ManagePaymentSettings';
import { GetPaymentBalancesUseCase } from '../../application/useCases/GetPaymentBalances';
import { ManagePaymentReportsUseCase } from '../../application/useCases/ManagePaymentReports';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';

const managePaymentGatewaysUseCase = new ManagePaymentGatewaysUseCase();
const managePaymentDisputesUseCase = new ManagePaymentDisputesUseCase();
const managePaymentFeesUseCase = new ManagePaymentFeesUseCase();
const managePaymentSettingsUseCase = new ManagePaymentSettingsUseCase();
const getPaymentBalancesUseCase = new GetPaymentBalancesUseCase();
const managePaymentReportsUseCase = new ManagePaymentReportsUseCase();

// ============================================================================
// Payment Gateways
// ============================================================================

export const listPaymentGateways = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  // For now, we'll use a default organization ID. In a real app, this would come from the authenticated user
  const organizationId = 'default-organization';

  const gateways = await managePaymentGatewaysUseCase.findAll(organizationId);

  adminRespond(req, res, 'payments/gateways/index', {
    pageName: 'Payment Gateways',
    gateways,

    success: req.query.success || null,
  });
};

export const createPaymentGatewayForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'payments/gateways/create', {
    pageName: 'Create Payment Gateway',
  });
};

export const createPaymentGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const organizationId = 'default-organization';
    const body = req.body as HttpRequestBody;
    const { name, provider, isActive, isDefault, isTestMode, apiKey, apiSecret, publicKey, webhookSecret, apiEndpoint } = body as {
      name: string;
      provider: string;
      isActive?: string | boolean;
      isDefault?: string | boolean;
      isTestMode?: string | boolean;
      apiKey?: string;
      apiSecret?: string;
      publicKey?: string;
      webhookSecret?: string;
      apiEndpoint?: string;
    };

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
    } as Parameters<typeof managePaymentGatewaysUseCase.create>[0]);

    res.redirect(`/hub/payments/gateways/${gateway.paymentGatewayId}?success=Payment gateway created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'payments/gateways/create', {
      pageName: 'Create Payment Gateway',
      error: (error as Error).message || 'Failed to create payment gateway',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewPaymentGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const editPaymentGatewayForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const updatePaymentGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { gatewayId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as HttpRequestBody;
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

export const deletePaymentGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listPaymentMethods = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listPaymentTransactions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listDisputes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status } = req.query;
  const allDisputes = await managePaymentDisputesUseCase.findAll(status as string | undefined, 100);

  adminRespond(req, res, 'payments/disputes/index', {
    pageName: 'Payment Disputes',
    disputes: allDisputes,
    filters: { status: status || '' },
    success: req.query.success || null,
  });
};

export const viewDispute = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const updateDisputeStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { disputeId } = req.params;
    const body = req.body as { status: string };
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

export const listPaymentFees = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listPaymentSettings = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const allSettings = await managePaymentSettingsUseCase.findAll();

  adminRespond(req, res, 'payments/settings/index', {
    pageName: 'Payment Settings',
    settings: allSettings,
    success: req.query.success || null,
  });
};

export const updatePaymentSettings = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const body = req.body as HttpRequestBody;

    const booleanFields = [
      'capturePaymentsAutomatically',
      'cardVaultingEnabled',
      'allowGuestCheckout',
      'requireBillingAddress',
      'requireCvv',
      'requirePostalCodeVerification',
      'autoRefundOnCancel',
    ] as const;
    const numberFields = ['authorizationValidityPeriod', 'paymentAttemptLimit'] as const;
    const jsonbFields = ['threeDSecureSettings', 'fraudDetectionSettings', 'receiptSettings', 'paymentFormCustomization'] as const;

    const updates: Record<string, unknown> = {};
    for (const field of booleanFields) {
      if (body[field] !== undefined) updates[field] = body[field] === 'true' || body[field] === true;
    }
    for (const field of numberFields) {
      if (body[field] !== undefined) updates[field] = Number(body[field]);
    }
    for (const field of jsonbFields) {
      if (body[field] !== undefined) {
        const value = body[field];
        updates[field] = typeof value === 'string' ? JSON.parse(value) : value;
      }
    }

    await managePaymentSettingsUseCase.upsert({
      organizationId,
      ...updates,
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

export const viewPaymentBalance = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const listPaymentReports = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const reports = await managePaymentReportsUseCase.findAll(100);

  adminRespond(req, res, 'payments/reports/index', {
    pageName: 'Payment Reports',
    reports,
    success: req.query.success || null,
  });
};

export const viewPaymentReport = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
