/**
 * Payment Controller
 * Handles payment management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import PaymentRepo from '../../../modules/payment/repos/paymentRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Payment Gateways
// ============================================================================

export const listPaymentGateways = async (req: Request, res: Response): Promise<void> => {
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

export const createPaymentGatewayForm = async (req: Request, res: Response): Promise<void> => {
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

export const createPaymentGateway = async (req: Request, res: Response): Promise<void> => {
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

export const viewPaymentGateway = async (req: Request, res: Response): Promise<void> => {
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

export const editPaymentGatewayForm = async (req: Request, res: Response): Promise<void> => {
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

export const updatePaymentGateway = async (req: Request, res: Response): Promise<void> => {
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

export const deletePaymentGateway = async (req: Request, res: Response): Promise<void> => {
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

export const listPaymentMethods = async (req: Request, res: Response): Promise<void> => {
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

export const listPaymentTransactions = async (req: Request, res: Response): Promise<void> => {
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
