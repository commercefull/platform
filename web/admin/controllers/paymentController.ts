/**
 * Payment Controller
 * Handles payment management for the Admin Hub
 */

import { Request, Response } from 'express';
import PaymentRepo from '../../../modules/payment/repos/paymentRepo';

// ============================================================================
// Payment Gateways
// ============================================================================

export const listPaymentGateways = async (req: Request, res: Response): Promise<void> => {
  try {
    // For now, we'll use a default merchant ID. In a real app, this would come from the authenticated user
    const merchantId = 'default-merchant';

    const gateways = await PaymentRepo.findAllGateways(merchantId);

    res.render('hub/views/payments/gateways/index', {
      pageName: 'Payment Gateways',
      gateways,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing payment gateways:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment gateways',
      user: req.user
    });
  }
};

export const createPaymentGatewayForm = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('hub/views/payments/gateways/create', {
      pageName: 'Create Payment Gateway',
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create gateway form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createPaymentGateway = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = 'default-merchant';
    const {
      name,
      provider,
      isActive,
      isDefault,
      isTestMode,
      apiKey,
      apiSecret,
      publicKey,
      webhookSecret,
      apiEndpoint
    } = req.body;

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
      processingFees: { percentage: 2.9, fixed: 0.30 } as any,
      metadata: {} as any,
      checkoutSettings: {} as any
    });

    res.redirect(`/hub/payments/gateways/${gateway.paymentGatewayId}?success=Payment gateway created successfully`);
  } catch (error: any) {
    console.error('Error creating payment gateway:', error);

    res.render('hub/views/payments/gateways/create', {
      pageName: 'Create Payment Gateway',
      error: error.message || 'Failed to create payment gateway',
      formData: req.body,
      user: req.user
    });
  }
};

export const viewPaymentGateway = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const gateway = await PaymentRepo.findGatewayById(gatewayId);

    if (!gateway) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Payment gateway not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/payments/gateways/view', {
      pageName: `Gateway: ${gateway.name}`,
      gateway,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing payment gateway:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment gateway',
      user: req.user
    });
  }
};

export const editPaymentGatewayForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const gateway = await PaymentRepo.findGatewayById(gatewayId);

    if (!gateway) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Payment gateway not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/payments/gateways/edit', {
      pageName: `Edit: ${gateway.name}`,
      gateway,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading edit gateway form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const updatePaymentGateway = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const updates: any = {};

    const {
      name,
      provider,
      isActive,
      isDefault,
      isTestMode,
      apiKey,
      apiSecret,
      publicKey,
      webhookSecret,
      apiEndpoint
    } = req.body;

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
    console.error('Error updating payment gateway:', error);

    try {
      const gateway = await PaymentRepo.findGatewayById(req.params.gatewayId);

      res.render('hub/views/payments/gateways/edit', {
        pageName: `Edit: ${gateway?.name || 'Gateway'}`,
        gateway,
        error: error.message || 'Failed to update payment gateway',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('hub/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to update payment gateway',
        user: req.user
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
    console.error('Error deleting payment gateway:', error);
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

    res.render('hub/views/payments/methods/index', {
      pageName: 'Payment Methods',
      methods,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing payment methods:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment methods',
      user: req.user
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

    res.render('hub/views/payments/transactions/index', {
      pageName: 'Payment Transactions',
      transactions,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing payment transactions:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment transactions',
      user: req.user
    });
  }
};
