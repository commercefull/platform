/**
 * Checkout Controller
 * HTTP interface for checkout operations with content negotiation (JSON/HTML)
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import CheckoutRepo from '../../infrastructure/repositories/CheckoutRepository';
import { getCheckoutPorts } from '../../../../boot/container';
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

function respond(req: TypedRequest, res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
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
  const { basketId, guestEmail } = req.body;
  const customerId = req.user?.customerId || (req.user as Record<string, unknown> | undefined)?.id as string | undefined;

  if (!basketId) {
    respondError(req, res, 'Basket ID is required', 400);
    return;
  }

  const command = new InitiateCheckoutCommand(basketId, customerId, guestEmail);
  const ports = getCheckoutPorts();
  const useCase = new InitiateCheckoutUseCase(CheckoutRepo, ports.basketSnapshot);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 201);
};

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
export const getCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await CheckoutRepo.findById(checkoutId);

  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  respond(req, res, mapCheckoutToResponse(session) as unknown as unknown, 200);
  
};

/**
 * Get checkout summary (totals and selected options)
 * GET /checkout/:checkoutId/summary
 */
export const getCheckoutSummary = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await CheckoutRepo.findById(checkoutId);

  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  // Reuse the same mapper; response includes subtotal, tax, shipping, discount, total
  respond(req, res, mapCheckoutToResponse(session) as unknown as unknown, 200);
  
};

/**
 * Set shipping address
 * PUT /checkout/:checkoutId/shipping-address
 */
export const setShippingAddress = async (req: TypedRequest<Record<string, string>, unknown, ShippingAddressBody>, res: Response): Promise<void> => {
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

  const ports = getCheckoutPorts();
  const useCase = new SetShippingAddressUseCase(CheckoutRepo, ports.basketSnapshot, ports.taxQuote, ports.promotionQuote);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
export const getShippingMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await CheckoutRepo.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  if (!session.shippingAddress) {
    respondError(req, res, 'Shipping address must be set first', 400);
    return;
  }

  // Fetch basket for order details
  let subtotal = 0;

  try {
    const ports = getCheckoutPorts();
    const basket = await ports.basketSnapshot.getSnapshot(session.basketId);
    if (basket) {
      subtotal = basket.subtotal?.amount ?? 0;
    }
  } catch {
    // Basket lookup is best-effort; fall back to defaults
  }

  const ports = getCheckoutPorts();
  const shippingOptions = await ports.shippingQuote.getShippingOptions({
    basketId: session.basketId,
    shippingAddress: {
      country: session.shippingAddress.country,
      region: session.shippingAddress.region,
      city: session.shippingAddress.city,
      postalCode: session.shippingAddress.postalCode,
    },
    totalValue: subtotal,
  });

  if (shippingOptions.length === 0) {
    respondError(req, res, 'No shipping methods available', 400);
    return;
  }

  // Map shipping options to the format expected by the checkout UI
  const methods = shippingOptions.map(rate => ({
    id: rate.methodId,
    name: rate.methodName,
    description: rate.estimatedDays ? `${rate.estimatedDays} day(s) delivery` : '',
    price: rate.amount,
    currency: rate.currency,
    estimatedDeliveryDays: rate.estimatedDays,
  }));

  respond(req, res, methods as unknown as unknown, 200);
  
};

/**
 * Get available pickup locations
 * GET /checkout/pickup-locations
 */
export const getPickupLocations = async (req: TypedRequest, res: Response): Promise<void> => {
  const { latitude, longitude, radius } = req.query;

  const ports = getCheckoutPorts();

  if (latitude && longitude) {
    const lat = parseFloat(String(latitude));
    const lng = parseFloat(String(longitude));
    const rad = radius ? parseFloat(String(radius)) : 50;
    const locations = await ports.storeFulfillment.findNearestPickupLocations(lat, lng, rad);
    respond(req, res, locations as unknown as unknown, 200);
    return;
  }

  const locations = await ports.storeFulfillment.getAllPickupLocations();
  respond(req, res, locations as unknown as unknown, 200);
  
};

/**
 * Set pickup location for checkout (BOPIS flow)
 * PUT /checkout/:checkoutId/pickup-location
 */
export const setPickupLocation = async (req: TypedRequest<Record<string, string>, unknown, PickupLocationBody>, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const { pickupLocationId } = req.body;

  if (!pickupLocationId) {
    respondError(req, res, 'Pickup location ID is required', 400);
    return;
  }

  const ports = getCheckoutPorts();
  const location = await ports.storeFulfillment.getPickupLocation(pickupLocationId);
  if (!location) {
    respondError(req, res, 'Pickup location not found or inactive', 404);
    return;
  }

  const session = await CheckoutRepo.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  session.setFulfillmentType('pickup');
  session.updateMetadata({
    pickupLocationId: location.locationId,
    pickupLocationName: location.storeName,
    pickupStoreId: location.storeId,
    pickupAddress: location.address,
  });

  // Validate inventory at pickup location for basket items
  const inventoryWarnings: Array<{ productId: string; available: number; requested: number }> = [];
  try {
    const basket = await ports.basketSnapshot.getSnapshot(session.basketId);
    if (basket) {
      for (const item of basket.items) {
        const availability = await ports.stockAvailability.checkAvailability({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        });
        if (!availability.available) {
          inventoryWarnings.push({
            productId: item.productId,
            available: availability.stockLevel || 0,
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

  const responseData = session as unknown as unknown;
  if (inventoryWarnings.length > 0) {
    (responseData as Record<string, unknown>).inventoryWarnings = inventoryWarnings;
  }
  respond(req, res, responseData, 200);
  
};

/**
 * Set fulfillment method (shipping, pickup, local_delivery, digital)
 * PUT /checkout/:checkoutId/fulfillment-method
 */
export const setFulfillmentMethod = async (req: TypedRequest<Record<string, string>, unknown, FulfillmentMethodBody>, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const { fulfillmentType } = req.body;

  if (!fulfillmentType) {
    respondError(req, res, 'fulfillmentType is required', 400);
    return;
  }

  const command = new SetFulfillmentMethodCommand(checkoutId, fulfillmentType);
  const useCase = new SetFulfillmentMethodUseCase(CheckoutRepo);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
export const setShippingMethod = async (req: TypedRequest<Record<string, string>, unknown, ShippingMethodBody>, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const { shippingMethodId } = req.body;

  if (!shippingMethodId) {
    respondError(req, res, 'Shipping method ID is required', 400);
    return;
  }

  const command = new SetShippingMethodCommand(checkoutId, shippingMethodId);
  const ports = getCheckoutPorts();
  const useCase = new SetShippingMethodUseCase(CheckoutRepo, ports.shippingQuote);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Get available payment methods
 * GET /checkout/payment-methods
 */
export const getPaymentMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  const methods = await CheckoutRepo.getAvailablePaymentMethods();
  respond(req, res, methods as unknown as unknown, 200);
  
};

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
export const setPaymentMethod = async (req: TypedRequest<Record<string, string>, unknown, PaymentMethodBody>, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const { paymentMethodId } = req.body;

  if (!paymentMethodId) {
    respondError(req, res, 'Payment method ID is required', 400);
    return;
  }

  const command = new SetPaymentMethodCommand(checkoutId, paymentMethodId);
  const useCase = new SetPaymentMethodUseCase(CheckoutRepo);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
export const applyCoupon = async (req: TypedRequest<Record<string, string>, unknown, CouponBody>, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const { couponCode } = req.body;

  if (!couponCode) {
    respondError(req, res, 'Coupon code is required', 400);
    return;
  }

  const command = new ApplyCouponCommand(checkoutId, couponCode);
  const ports = getCheckoutPorts();
  const useCase = new ApplyCouponUseCase(CheckoutRepo, ports.discountQuote);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
export const removeCoupon = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const command = new RemoveCouponCommand(checkoutId);
  const useCase = new RemoveCouponUseCase(CheckoutRepo);
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
export const completeCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const ports = getCheckoutPorts();
  const command = new CompleteCheckoutCommand(checkoutId);
  const useCase = new CompleteCheckoutUseCase(CheckoutRepo, ports.orderPlacement);
  const result = await useCase.execute(command);

  respond(req, res, result as unknown as unknown, 201);
  
};

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
export const abandonCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const ports = getCheckoutPorts();
  const command = new AbandonCheckoutCommand(checkoutId);
  const useCase = new AbandonCheckoutUseCase(CheckoutRepo, ports.orderPlacement);
  const result = await useCase.execute(command);

  respond(req, res, result as unknown as unknown, 200);
  
};

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
export const setBillingAddress = async (req: TypedRequest<Record<string, string>, unknown, BillingAddressBody>, res: Response): Promise<void> => {
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

  respond(req, res, checkout as unknown as unknown, 200);
  
};

/**
 * Create payment intent and draft order
 * POST /checkout/:checkoutId/payment-intent
 */
export const createPaymentIntent = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const customerId = req.user?.customerId || (req.user as Record<string, unknown> | undefined)?.id as string | undefined;

  const ports = getCheckoutPorts();
  const command = new CreatePaymentIntentCommand(checkoutId, customerId);
  const useCase = new CreatePaymentIntentUseCase(
    CheckoutRepo,
    ports.basketSnapshot,
    ports.orderPlacement,
    ports.paymentAuthorization,
  );
  const result = await useCase.execute(command);

  respond(req, res, result as unknown as unknown, 201);
};

/**
 * Get local delivery options for a checkout session
 * GET /checkout/:checkoutId/local-delivery-options
 */
export const getLocalDeliveryOptions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await CheckoutRepo.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
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
    respondError(req, res, 'Shipping address must be set first', 400);
    return;
  }

  const ports = getCheckoutPorts();
  const result = await ports.storeFulfillment.checkLocalDeliveryEligibility(address);

  respond(req, res, result as unknown as unknown, 200);
  
};

/**
 * Get all available fulfillment options for a checkout session
 * GET /checkout/:checkoutId/fulfillment-options
 */
export const getFulfillmentOptions = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await CheckoutRepo.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  // Fetch basket to determine item types
  const ports = getCheckoutPorts();
  let hasDigitalItems = false;
  let hasPhysicalItems = false;
  try {
    const basket = await ports.basketSnapshot.getSnapshot(session.basketId);
    if (basket) {
      hasDigitalItems = basket.items.some(item => item.isDigital);
      hasPhysicalItems = basket.items.some(item => item.itemType === 'physical');
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
      const shippingOptions = await ports.shippingQuote.getShippingOptions({
        basketId: session.basketId,
        shippingAddress: {
          country: session.shippingAddress.country,
          region: session.shippingAddress.region,
          city: session.shippingAddress.city,
          postalCode: session.shippingAddress.postalCode,
        },
        totalValue: session.subtotal.amount,
      });
      options.shippingMethods = shippingOptions.map(rate => ({
        id: rate.methodId,
        name: rate.methodName,
        price: rate.amount,
        currency: rate.currency,
        estimatedDeliveryDays: rate.estimatedDays,
      }));
    } catch {
      // Best-effort
    }
  }

  // Get pickup locations
  try {
    const locations = await ports.storeFulfillment.getAllPickupLocations();
    options.pickupLocations = locations;
  } catch {
    // Best-effort
  }

  // Get local delivery options if address is set
  if (session.shippingAddress && types.includes('local_delivery')) {
    try {
      const deliveryResult = await ports.storeFulfillment.checkLocalDeliveryEligibility({
        postalCode: session.shippingAddress.postalCode,
        city: session.shippingAddress.city,
        country: session.shippingAddress.country,
      });
      options.localDeliveryOptions = deliveryResult.options;
    } catch {
      // Best-effort
    }
  }

  respond(req, res, options as unknown as unknown, 200);
  
};

/**
 * Get available pickup time slots
 * GET /checkout/:checkoutId/pickup-slots
 */
export const getPickupSlots = async (req: TypedRequest, res: Response): Promise<void> => {
  const { checkoutId } = req.params;
  const daysAhead = req.query.days ? parseInt(String(req.query.days), 10) : 7;

  const session = await CheckoutRepo.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  const meta = session.metadata || {};
  const pickupLocationId = meta.pickupLocationId as string | undefined;
  if (!pickupLocationId) {
    respondError(req, res, 'Pickup location not set', 400);
    return;
  }

  const ports = getCheckoutPorts();
  const location = await ports.storeFulfillment.getPickupLocation(pickupLocationId);
  if (!location) {
    respondError(req, res, 'Pickup location not found', 404);
    return;
  }

  const useCase = new GetPickupSlotsUseCase();
  const slots = useCase.execute({
    maxOrdersPerSlot: 10,
    prepareTimeMinutes: 60,
    operatingHours: {} as Record<string, { open: string; close: string }>,
  }, daysAhead);

  respond(req, res, slots as unknown as unknown, 200);
  
};
