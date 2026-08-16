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
import InventoryRepo from '../../../inventory/infrastructure/repositories/inventoryRepo';
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
  SetFulfillmentMethodCommand,
  SetFulfillmentMethodUseCase,
  CheckLocalDeliveryEligibilityUseCase,
  GetPickupSlotsUseCase,
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

interface FulfillmentMethodBody {
  fulfillmentType: 'shipping' | 'pickup' | 'local_delivery' | 'digital';
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
    const customerId = req.user?.customerId || (req.user as Record<string, unknown> | undefined)?.id as string | undefined;

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

    const message = (error as Error).message || 'Failed to initiate checkout';
    const isNotFound = message.includes('Basket not found') || message.includes('not found');
    const isEmpty = message.includes('empty basket');

    const statusCode = isNotFound ? 404 : isEmpty ? 400 : 500;
    respondError(req, res, message, statusCode, 'checkout/error');
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

    const useCase = new SetShippingAddressUseCase(CheckoutRepo, BasketRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/shipping');
  } catch (error: unknown) {
    logger.error('Error:', error);
    const message = (error as Error).message || 'Failed to set shipping address';
    const msgLower = message.toLowerCase();
    const statusCode = msgLower.includes('not found') ? 404 
      : (msgLower.includes('completed') || msgLower.includes('invalid state') || msgLower.includes('cannot modify')) ? 400 
      : 500;
    respondError(req, res, message, statusCode, 'checkout/error');
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

    session.setFulfillmentType('pickup');
    session.updateMetadata({
      pickupLocationId: location.pickupLocationId,
      pickupLocationName: location.name,
      pickupStoreId: location.storeId,
      pickupAddress: location.address,
      pickupInstructions: location.instructions,
      pickupPrepareTime: location.prepareTimeMinutes,
    });

    // Validate inventory at pickup location for basket items
    const inventoryWarnings: Array<{ productId: string; available: number; requested: number }> = [];
    try {
      const basket = await BasketRepo.findById(session.basketId);
      if (basket) {
        const basketItems = await BasketRepo.getItems(session.basketId);
        for (const item of basketItems) {
          const availability = await InventoryRepo.checkProductAvailability(item.productId, item.productVariantId, item.quantity);
          if (!availability.available) {
            inventoryWarnings.push({
              productId: item.productId,
              available: availability.totalAvailable,
              requested: item.quantity,
            });
          }
        }
      }
    } catch {
      // Inventory check is best-effort
    }

    if (inventoryWarnings.length > 0) {
      session.updateMetadata({ pickupInventoryWarnings: inventoryWarnings });
    }

    await CheckoutRepo.save(session);

    const responseData = session as unknown as ResponseData;
    if (inventoryWarnings.length > 0) {
      (responseData as Record<string, unknown>).inventoryWarnings = inventoryWarnings;
    }
    respond(req, res, responseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to set pickup location', 500, 'checkout/error');
  }
};

/**
 * Set fulfillment method (shipping, pickup, local_delivery, digital)
 * PUT /checkout/:checkoutId/fulfillment-method
 */
export const setFulfillmentMethod = async (req: TypedRequest<Record<string, string>, unknown, FulfillmentMethodBody>, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const { fulfillmentType } = req.body;

    if (!fulfillmentType) {
      respondError(req, res, 'fulfillmentType is required', 400, 'checkout/error');
      return;
    }

    const command = new SetFulfillmentMethodCommand(checkoutId, fulfillmentType);
    const useCase = new SetFulfillmentMethodUseCase(CheckoutRepo);
    const checkout = await useCase.execute(command);

    respond(req, res, checkout as unknown as ResponseData, 200, 'checkout/view');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to set fulfillment method', 500, 'checkout/error');
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

    const message = (error as Error).message || 'Failed to complete checkout';
    const isNotFound = message.includes('not found');
    const isBadRequest = message.includes('payment has not been confirmed') || message.includes('shipping address') || message.includes('shipping method') || message.includes('payment method');

    const statusCode = isNotFound ? 404 : isBadRequest ? 400 : 500;
    respondError(req, res, message, statusCode, 'checkout/error');
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
    const customerId = req.user?.customerId || (req.user as Record<string, unknown> | undefined)?.id as string | undefined;

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

/**
 * Get local delivery options for a checkout session
 * GET /checkout/:checkoutId/local-delivery-options
 */
export const getLocalDeliveryOptions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const session = await CheckoutRepo.findById(checkoutId);
    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    const address = session.shippingAddress
      ? {
          latitude: undefined as number | undefined,
          longitude: undefined as number | undefined,
          postalCode: session.shippingAddress.postalCode,
          city: session.shippingAddress.city,
          country: session.shippingAddress.country,
        }
      : undefined;

    if (!address) {
      respondError(req, res, 'Shipping address must be set first', 400, 'checkout/error');
      return;
    }

    const useCase = new CheckLocalDeliveryEligibilityUseCase();
    const result = await useCase.execute(address);

    respond(req, res, result as unknown as ResponseData, 200, 'checkout/local-delivery-options');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to get local delivery options', 500, 'checkout/error');
  }
};

/**
 * Get all available fulfillment options for a checkout session
 * GET /checkout/:checkoutId/fulfillment-options
 */
export const getFulfillmentOptions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;

    const session = await CheckoutRepo.findById(checkoutId);
    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    // Fetch basket to determine item types
    let hasDigitalItems = false;
    let hasPhysicalItems = false;
    try {
      const basket = await BasketRepo.findById(session.basketId);
      if (basket) {
        const items = await BasketRepo.getItems(session.basketId);
        hasDigitalItems = items.some(item => item.itemType === 'digital');
        hasPhysicalItems = items.some(item => item.itemType === 'physical');
      }
    } catch {
      // Best-effort
    }

    const options: Record<string, unknown> = {
      fulfillmentTypes: [] as string[],
      shippingMethods: [] as unknown[],
      pickupLocations: [] as unknown[],
      localDeliveryOptions: [] as unknown[],
    };

    // Determine available fulfillment types
    const types: string[] = [];
    if (hasPhysicalItems) {
      types.push('shipping', 'pickup', 'local_delivery');
    }
    if (hasDigitalItems && !hasPhysicalItems) {
      types.push('digital');
    }
    if (!hasDigitalItems && !hasPhysicalItems) {
      types.push('shipping', 'pickup');
    }
    options.fulfillmentTypes = types;

    // Get shipping methods if address is set
    if (session.shippingAddress && (types.includes('shipping') || types.includes('local_delivery'))) {
      try {
        const shippingUseCase = new CalculateShippingRatesUseCase();
        const shippingCommand = new CalculateShippingRatesCommand(
          {
            country: session.shippingAddress.country,
            state: session.shippingAddress.region,
            city: session.shippingAddress.city,
            postalCode: session.shippingAddress.postalCode,
          },
          { subtotal: session.subtotal.amount, itemCount: 0, currency: session.subtotal.currency },
        );
        const shippingResult = await shippingUseCase.execute(shippingCommand);
        if (shippingResult.success) {
          options.shippingMethods = shippingResult.rates.map(rate => ({
            id: rate.shippingMethodId,
            name: rate.shippingMethodName,
            price: rate.amount,
            currency: rate.currency,
            estimatedDeliveryDays: rate.estimatedDeliveryDays,
            isFreeShipping: rate.isFreeShipping,
          }));
        }
      } catch {
        // Best-effort
      }
    }

    // Get pickup locations
    try {
      const locations = await getAllPickupLocations();
      options.pickupLocations = locations;
    } catch {
      // Best-effort
    }

    // Get local delivery options if address is set
    if (session.shippingAddress && types.includes('local_delivery')) {
      try {
        const deliveryUseCase = new CheckLocalDeliveryEligibilityUseCase();
        const deliveryResult = await deliveryUseCase.execute({
          postalCode: session.shippingAddress.postalCode,
          city: session.shippingAddress.city,
          country: session.shippingAddress.country,
        });
        options.localDeliveryOptions = deliveryResult.options;
      } catch {
        // Best-effort
      }
    }

    respond(req, res, options as unknown as ResponseData, 200, 'checkout/fulfillment-options');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to get fulfillment options', 500, 'checkout/error');
  }
};

/**
 * Get available pickup time slots
 * GET /checkout/:checkoutId/pickup-slots
 */
export const getPickupSlots = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const daysAhead = req.query.days ? parseInt(String(req.query.days), 10) : 7;

    const session = await CheckoutRepo.findById(checkoutId);
    if (!session) {
      respondError(req, res, 'Checkout session not found', 404, 'checkout/error');
      return;
    }

    const meta = session.metadata || {};
    const pickupLocationId = meta.pickupLocationId as string | undefined;
    if (!pickupLocationId) {
      respondError(req, res, 'Pickup location not set', 400, 'checkout/error');
      return;
    }

    const location = await getPickupLocation(pickupLocationId);
    if (!location) {
      respondError(req, res, 'Pickup location not found', 404, 'checkout/error');
      return;
    }

    const useCase = new GetPickupSlotsUseCase();
    const slots = useCase.execute({
      maxOrdersPerSlot: location.maxOrdersPerSlot || 10,
      prepareTimeMinutes: location.prepareTimeMinutes || 60,
      operatingHours: (location.operatingHours || {}) as Record<string, { open: string; close: string }>,
    }, daysAhead);

    respond(req, res, slots as unknown as ResponseData, 200, 'checkout/pickup-slots');
  } catch (error: unknown) {
    logger.error('Error:', error);
    respondError(req, res, (error as Error).message || 'Failed to get pickup slots', 500, 'checkout/error');
  }
};
