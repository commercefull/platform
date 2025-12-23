/**
 * Checkout Controller
 * HTTP interface for checkout operations with content negotiation (JSON/HTML)
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import CheckoutRepo from '../../infrastructure/repositories/CheckoutRepository';
import BasketRepo from '../../../basket/infrastructure/repositories/BasketRepository';
import { Money } from '../../../basket/domain/valueObjects/Money';
import {
  InitiateCheckoutCommand,
  InitiateCheckoutUseCase,
  mapCheckoutToResponse,
  SetShippingAddressCommand,
  SetShippingAddressUseCase,
  SetBillingAddressCommand,
  SetBillingAddressUseCase,
  SetShippingMethodCommand,
  SetShippingMethodUseCase,
  SetPaymentMethodCommand,
  SetPaymentMethodUseCase,
  ApplyCouponCommand,
  ApplyCouponUseCase,
  RemoveCouponCommand,
  RemoveCouponUseCase,
  CompleteCheckoutCommand,
  CompleteCheckoutUseCase,
  AbandonCheckoutCommand,
  AbandonCheckoutUseCase
} from '../../application/useCases';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

type ResponseData = Record<string, any>;

/**
 * Respond with JSON or HTML based on Accept header
 */
function respond(
  req: Request,
  res: Response,
  data: ResponseData,
  statusCode: number = 200,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

/**
 * Respond with error in JSON or HTML based on Accept header
 */
function respondError(
  req: Request,
  res: Response,
  message: string,
  statusCode: number = 500,
  htmlTemplate?: string
): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { error: message, success: false });
  } else {
    res.status(statusCode).json({ success: false, error: message });
  }
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Initiate checkout
 * POST /checkout
 */
export const initiateCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId, guestEmail } = req.body;
    const customerId = (req as any).user?.customerId;

    if (!basketId) {
      respondError(req, res, 'Basket ID is required', 400, 'checkout/error');
      return;
    }

    const command = new InitiateCheckoutCommand(basketId, customerId, guestEmail);
    const useCase = new InitiateCheckoutUseCase(CheckoutRepo, BasketRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 201, 'checkout/view');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to initiate checkout', 500, 'checkout/error');
  }
};

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
export const getCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const session = await CheckoutRepo.findById(checkoutId);

    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    respond(req, res, mapCheckoutToResponse(session), 200, 'checkout/view');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to get checkout', 500, 'checkout/error');
  }
};

/**
 * Set shipping address
 * PUT /checkout/:checkoutId/shipping-address
 */
export const setShippingAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { firstName, lastName, company, addressLine1, addressLine2, city, region, postalCode, country, phone } = req.body;

    const command = new SetShippingAddressCommand(
      checkoutId,
      firstName,
      lastName,
      addressLine1,
      city,
      postalCode,
      country,
      company,
      addressLine2,
      region,
      phone
    );

    const useCase = new SetShippingAddressUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 200, 'checkout/shipping');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to set shipping address', 500, 'checkout/error');
  }
};

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
export const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const session = await CheckoutRepo.findById(checkoutId);
    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    if (!session.shippingAddress) {
      respondError(req, res, 'Shipping address must be set first', 400, 'checkout/error');
      return;
    }

    const methods = await CheckoutRepo.getAvailableShippingMethods(
      session.shippingAddress.country,
      session.shippingAddress.postalCode
    );

    respond(req, res, methods, 200, 'checkout/shipping-methods');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to get shipping methods', 500, 'checkout/error');
  }
};

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
export const setShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { shippingMethodId } = req.body;

    if (!shippingMethodId) {
      respondError(req, res, 'Shipping method ID is required', 400, 'checkout/error');
      return;
    }

    const command = new SetShippingMethodCommand(checkoutId, shippingMethodId);
    const useCase = new SetShippingMethodUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 200, 'checkout/view');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to set shipping method', 500, 'checkout/error');
  }
};

/**
 * Get available payment methods
 * GET /checkout/payment-methods
 */
export const getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await CheckoutRepo.getAvailablePaymentMethods();
    respond(req, res, methods, 200, 'checkout/payment-methods');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to get payment methods', 500, 'checkout/error');
  }
};

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
export const setPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      respondError(req, res, 'Payment method ID is required', 400, 'checkout/error');
      return;
    }

    const command = new SetPaymentMethodCommand(checkoutId, paymentMethodId);
    const useCase = new SetPaymentMethodUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 200, 'checkout/view');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to set payment method', 500, 'checkout/error');
  }
};

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
export const applyCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { couponCode } = req.body;

    if (!couponCode) {
      respondError(req, res, 'Coupon code is required', 400, 'checkout/error');
      return;
    }

    const command = new ApplyCouponCommand(checkoutId, couponCode);
    const useCase = new ApplyCouponUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 200, 'checkout/view');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to apply coupon', 500, 'checkout/error');
  }
};

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
export const removeCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const command = new RemoveCouponCommand(checkoutId);
    const useCase = new RemoveCouponUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 200, 'checkout/view');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to remove coupon', 500, 'checkout/error');
  }
};

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
export const completeCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const command = new CompleteCheckoutCommand(checkoutId);
    const useCase = new CompleteCheckoutUseCase(CheckoutRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201, 'checkout/complete');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to complete checkout', 500, 'checkout/error');
  }
};

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
export const abandonCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const command = new AbandonCheckoutCommand(checkoutId);
    const useCase = new AbandonCheckoutUseCase(CheckoutRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'checkout/abandoned');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to abandon checkout', 500, 'checkout/error');
  }
};

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
export const setBillingAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { firstName, lastName, company, addressLine1, addressLine2, city, region, postalCode, country, phone, sameAsShipping } = req.body;

    const command = new SetBillingAddressCommand(
      checkoutId,
      firstName,
      lastName,
      addressLine1,
      city,
      postalCode,
      country,
      company,
      addressLine2,
      region,
      phone,
      sameAsShipping
    );

    const useCase = new SetBillingAddressUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout, 200, 'checkout/billing');
  } catch (error: any) {
    logger.error('Error:', error);
    
    respondError(req, res, error.message || 'Failed to set billing address', 500, 'checkout/error');
  }
};
