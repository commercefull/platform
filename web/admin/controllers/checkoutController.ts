/**
 * Checkout Controller for Admin Hub
 * Handles Checkout Configuration management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

export const checkoutSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/checkout/index', {
      pageName: 'Checkout Settings',
      settings: {},
      paymentMethods: [],
      shippingOptions: [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error loading checkout settings:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load checkout settings',
    });
  }
};

export const updateCheckoutSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/checkout?success=Checkout settings updated successfully');
  } catch (error: any) {
    logger.error('Error updating checkout settings:', error);
    adminRespond(req, res, 'settings/checkout/index', {
      pageName: 'Checkout Settings',
      settings: {},
      paymentMethods: [],
      shippingOptions: [],
      error: error.message || 'Failed to update checkout settings',
    });
  }
};

export const listPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/checkout/payment-methods', {
      pageName: 'Checkout Payment Methods',
      paymentMethods: [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing payment methods:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load payment methods',
    });
  }
};

export const updatePaymentMethodOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Payment method order updated successfully' });
  } catch (error: any) {
    logger.error('Error updating payment method order:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update order' });
  }
};

export const listShippingOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/checkout/shipping-options', {
      pageName: 'Checkout Shipping Options',
      shippingOptions: [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing shipping options:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping options',
    });
  }
};

export const updateShippingOptionOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Shipping option order updated successfully' });
  } catch (error: any) {
    logger.error('Error updating shipping option order:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update order' });
  }
};
