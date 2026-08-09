/**
 * Checkout Controller
 * HTTP interface for checkout operations with content negotiation (JSON/HTML)
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import CheckoutRepo from '../../infrastructure/repositories/CheckoutRepository';
import BasketRepo from '../../../basket/infrastructure/repositories/BasketRepository';
import OrderRepo from '../../../order/infrastructure/repositories/OrderRepository';
import PaymentRepo from '../../../payment/infrastructure/repositories/PaymentRepository';
import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from '../../../shipping/application/useCases/CalculateShippingRates';
import { getLocations as getAllPickupLocations, getLocation as getPickupLocation, findNearestLocations as findNearestPickupLocations } from '../../../store/infrastructure/repositories/pickupLocationRepo';
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
  AbandonCheckoutUseCase,
  CreatePaymentIntentCommand,
  CreatePaymentIntentUseCase,
} from '../../application/useCases';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

type ResponseData = Record<string, unknown> | Record<string, unknown>[];

/**
 * Respond with JSON or HTML based on Accept header
 */
function respond(req: TypedRequest, res: Response, data: ResponseData, statusCode: number = 200, htmlTemplate?: string): void {
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
function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';

  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { error: message, success: false });
  } else {
    res.status(statusCode).json({ success: false, error: message });
  }
}

interface InitiateCheckoutBody {
  basketId: string;
  guestEmail?: string;
}

interface ShippingAddressBody {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface BillingAddressBody extends ShippingAddressBody {
  sameAsShipping?: boolean;
}

interface PickupLocationBody {
  pickupLocationId: string;
}

interface ShippingMethodBody {
  shippingMethodId: string;
}

interface PaymentMethodBody {
  paymentMethodId: string;
}

interface CouponBody {
  couponCode: string;
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Initiate checkout
 * POST /checkout
 */
export const initiateCheckout = async (req: TypedRequest<Record<string, string>, unknown, InitiateCheckoutBody>, res: Response): Promise<void> => {
  try {
    const { basketId, guestEmail } = req.body;
    const customerId = req.user?.customerId;

    if (!basketId) {
      respondError(req, res, 'Basket ID is required', 400, 'checkout/error');
      return;
    }

    const command = new InitiateCheckoutCommand(basketId, customerId, guestEmail);
    const useCase = new InitiateCheckoutUseCase(CheckoutRepo, BasketRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout as unknown as ResponseData, 201, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to initiate checkout', 500, 'checkout/error');
  }
};

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
export const getCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const session = await CheckoutRepo.findById(checkoutId);

    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    respond(req, res, mapCheckoutToResponse(session) as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get checkout', 500, 'checkout/error');
  }
};

/**
 * Set shipping address
 * PUT /checkout/:checkoutId/shipping-address
 */
export const setShippingAddress = async (req: TypedRequest<Record<string, string>, unknown, ShippingAddressBody>, res: Response): Promise<void> => {
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
      phone,
    );

    const useCase = new SetShippingAddressUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/shipping');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to set shipping address', 500, 'checkout/error');
  }
};

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
export const getShippingMethods = async (req: TypedRequest, res: Response): Promise<void> => {
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

    // Fetch basket for order details
    let subtotal = 0;
    let itemCount = 0;
    let currency = 'USD';

    try {
      const basket = await BasketRepo.findById(session.basketId);
      if (basket) {
        subtotal = basket.subtotal?.amount ?? 0;
        itemCount = basket.itemCount ?? 0;
        currency = basket.subtotal?.currency ?? 'USD';
      }
    } catch {
      // Basket lookup is best-effort; fall back to defaults
    }

    const shippingUseCase = new CalculateShippingRatesUseCase();
    const shippingCommand = new CalculateShippingRatesCommand(
      {
        country: session.shippingAddress.country,
        state: session.shippingAddress.region,
        city: session.shippingAddress.city,
        postalCode: session.shippingAddress.postalCode,
      },
      { subtotal, itemCount, currency },
    );
    const result = await shippingUseCase.execute(shippingCommand);

    if (!result.success) {
      respondError(req, res, result.message || 'Failed to get shipping methods', 400, 'checkout/error');
      return;
    }

    // Map shipping rate options to the format expected by the checkout UI
    const methods = result.rates.map(rate => ({
      id: rate.shippingMethodId,
      name: rate.shippingMethodName,
      description: rate.estimatedDeliveryDays ? `${rate.estimatedDeliveryDays} day(s) delivery` : '',
      price: rate.amount,
      currency: rate.currency,
      estimatedDeliveryDays: rate.estimatedDeliveryDays,
      isFreeShipping: rate.isFreeShipping,
      rateId: rate.rateId,
    }));

    respond(req, res, methods as unknown as ResponseData, 200, 'checkout/shipping-methods');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get shipping methods', 500, 'checkout/error');
  }
};

/**
 * Get available pickup locations
 * GET /checkout/pickup-locations
 */
export const getPickupLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { storeId, latitude, longitude, radius } = req.query;

    if (latitude && longitude) {
      const lat = parseFloat(String(latitude));
      const lng = parseFloat(String(longitude));
      const rad = radius ? parseFloat(String(radius)) : 50;
      const locations = await findNearestPickupLocations(lat, lng, rad, 20);
      respond(req, res, locations as unknown as ResponseData, 200, 'checkout/pickup-locations');
      return;
    }

    const locations = await getAllPickupLocations(storeId ? String(storeId) : undefined);
    respond(req, res, locations as unknown as ResponseData, 200, 'checkout/pickup-locations');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to get pickup locations', 500, 'checkout/error');
  }
};

/**
 * Set pickup location for checkout (BOPIS flow)
 * PUT /checkout/:checkoutId/pickup-location
 */
export const setPickupLocation = async (req: TypedRequest<Record<string, string>, unknown, PickupLocationBody>, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { pickupLocationId } = req.body;

    if (!pickupLocationId) {
      respondError(req, res, 'Pickup location ID is required', 400, 'checkout/error');
      return;
    }

    const location = await getPickupLocation(pickupLocationId);
    if (!location || !location.isActive) {
      respondError(req, res, 'Pickup location not found or inactive', 404, 'checkout/error');
      return;
    }

    const session = await CheckoutRepo.findById(checkoutId);
    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    session.updateMetadata({
      fulfillmentType: 'pickup',
      pickupLocationId: location.pickupLocationId,
      pickupLocationName: location.name,
      pickupStoreId: location.storeId,
      pickupAddress: location.address,
      pickupInstructions: location.instructions,
      pickupPrepareTime: location.prepareTimeMinutes,
    });
    await CheckoutRepo.save(session);

    respond(req, res, session as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to set pickup location', 500, 'checkout/error');
  }
};

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
export const setShippingMethod = async (req: TypedRequest<Record<string, string>, unknown, ShippingMethodBody>, res: Response): Promise<void> => {
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

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to set shipping method', 500, 'checkout/error');
  }
};

/**
 * Get available payment methods
 * GET /checkout/payment-methods
 */
export const getPaymentMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const methods = await CheckoutRepo.getAvailablePaymentMethods();
    respond(req, res, methods as unknown as ResponseData, 200, 'checkout/payment-methods');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get payment methods', 500, 'checkout/error');
  }
};

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
export const setPaymentMethod = async (req: TypedRequest<Record<string, string>, unknown, PaymentMethodBody>, res: Response): Promise<void> => {
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

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to set payment method', 500, 'checkout/error');
  }
};

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
export const applyCoupon = async (req: TypedRequest<Record<string, string>, unknown, CouponBody>, res: Response): Promise<void> => {
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

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to apply coupon', 500, 'checkout/error');
  }
};

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
export const removeCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const command = new RemoveCouponCommand(checkoutId);
    const useCase = new RemoveCouponUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to remove coupon', 500, 'checkout/error');
  }
};

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
export const completeCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const command = new CompleteCheckoutCommand(checkoutId);
    const useCase = new CompleteCheckoutUseCase(CheckoutRepo, OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result as unknown as ResponseData, 201, 'checkout/complete');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to complete checkout', 500, 'checkout/error');
  }
};

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
export const abandonCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const command = new AbandonCheckoutCommand(checkoutId);
    const useCase = new AbandonCheckoutUseCase(CheckoutRepo, OrderRepo);
    const result = await useCase.execute(command);

    respond(req, res, result as unknown as ResponseData, 200, 'checkout/abandoned');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to abandon checkout', 500, 'checkout/error');
  }
};

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
export const setBillingAddress = async (req: TypedRequest<Record<string, string>, unknown, BillingAddressBody>, res: Response): Promise<void> => {
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
      sameAsShipping,
    );

    const useCase = new SetBillingAddressUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/billing');
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to set billing address', 500, 'checkout/error');
  }
};

/**
 * Create payment intent and draft order
 * POST /checkout/:checkoutId/payment-intent
 */
export const createPaymentIntent = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const customerId = req.user?.customerId;

    const command = new CreatePaymentIntentCommand(checkoutId, customerId);
    const useCase = new CreatePaymentIntentUseCase(CheckoutRepo, BasketRepo, OrderRepo, PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result as unknown as ResponseData, 201, 'checkout/payment-intent');
  } catch (error: unknown) {
    logger.error('Error:', error);

    const isNotFound = (error as Error).message?.includes('not found');
    const isNotReady = (error as Error).message?.includes('not ready for payment');
    const isNoGateway = (error as Error).message?.includes('No payment gateway');

    const statusCode = isNotFound ? 404 : isNotReady ? 400 : isNoGateway ? 503 : 500;
    respondError(req, res, (error as Error).message || 'Failed to create payment intent', statusCode, 'checkout/error');
  }
};
