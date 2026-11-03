import { jsonResponse } from 'libs/apiResponse';
/**
 * Checkout Controller
 * HTTP interface for checkout operations with content negotiation (JSON/HTML)
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  InitiateCheckoutCommand,
  mapCheckoutToResponse,
  SetShippingAddressCommand,
  SetBillingAddressCommand,
  SetShippingMethodCommand,
  SetPaymentMethodCommand,
  SetFulfillmentMethodCommand,
  ApplyCouponCommand,
  RemoveCouponCommand,
  ApplyLoyaltyRewardCommand,
  RemoveLoyaltyRewardCommand,
  SetVatNumberCommand,
  CompleteCheckoutCommand,
  AbandonCheckoutCommand,
  CreatePaymentIntentCommand,
} from '../../application/useCases';
import {
  abandonCheckoutUseCase,
  applyCouponUseCase,
  completeCheckoutUseCase,
  createPaymentIntentUseCase,
  initiateCheckoutUseCase,
  manageCheckoutSessionUseCase,
  removeCouponUseCase,
  applyLoyaltyRewardUseCase,
  removeLoyaltyRewardUseCase,
  setBillingAddressUseCase,
  setFulfillmentMethodUseCase,
  setPaymentMethodUseCase,
  setShippingAddressUseCase,
  setShippingMethodUseCase,
  setVatNumberUseCase,
} from '../../application/useCases/wired';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

export function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  jsonResponse(res, statusCode, { success: true, data });
}

export function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  jsonResponse(res, statusCode, { success: false, error: message });
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

interface VatNumberBody {
  vatNumber?: string;
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * Initiate checkout
 * POST /checkout
 */
export const initiateCheckout = async (
  req: HttpRequest<Record<string, string>, unknown, InitiateCheckoutBody>,
  res: HttpResponse,
): Promise<void> => {
  const { basketId, guestEmail } = req.body;
  const customerId = req.user?.customerId || ((req.user as Record<string, unknown> | undefined)?.id as string | undefined);

  if (!basketId) {
    respondError(req, res, 'Basket ID is required', 400);
    return;
  }

  const command = new InitiateCheckoutCommand(basketId, customerId, guestEmail);
  const useCase = initiateCheckoutUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 201);
};

/**
 * Get checkout session
 * GET /checkout/:checkoutId
 */
export const getCheckout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await manageCheckoutSessionUseCase.findById(checkoutId);

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
export const getCheckoutSummary = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await manageCheckoutSessionUseCase.findById(checkoutId);

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
export const setShippingAddress = async (
  req: HttpRequest<Record<string, string>, unknown, ShippingAddressBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { firstName, lastName, company, addressLine1, addressLine2, city, region, postalCode, country, phone } = req.body;

  const command = new SetShippingAddressCommand({
    checkoutId: checkoutId,
    firstName: firstName,
    lastName: lastName,
    addressLine1: addressLine1,
    city: city,
    postalCode: postalCode,
    country: country,
    company: company,
    addressLine2: addressLine2,
    region: region,
    phone: phone,
  });
  const useCase = setShippingAddressUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Set the customer VAT ID (B2B) — triggers a tax requote that applies
 * intra-EU reverse charge when eligible.
 * PUT /checkout/:checkoutId/vat-number
 */
export const setVatNumber = async (req: HttpRequest<Record<string, string>, unknown, VatNumberBody>, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;
  const checkout = await setVatNumberUseCase.execute(new SetVatNumberCommand(checkoutId, req.body?.vatNumber));

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Set fulfillment method (shipping, pickup, local_delivery, digital)
 * PUT /checkout/:checkoutId/fulfillment-method
 */
export const setFulfillmentMethod = async (
  req: HttpRequest<Record<string, string>, unknown, FulfillmentMethodBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { fulfillmentType } = req.body;

  if (!fulfillmentType) {
    respondError(req, res, 'fulfillmentType is required', 400);
    return;
  }

  const command = new SetFulfillmentMethodCommand(checkoutId, fulfillmentType);
  const useCase = setFulfillmentMethodUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Set shipping method
 * PUT /checkout/:checkoutId/shipping-method
 */
export const setShippingMethod = async (
  req: HttpRequest<Record<string, string>, unknown, ShippingMethodBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { shippingMethodId } = req.body;

  if (!shippingMethodId) {
    respondError(req, res, 'Shipping method ID is required', 400);
    return;
  }

  const command = new SetShippingMethodCommand(checkoutId, shippingMethodId);
  const useCase = setShippingMethodUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Get available payment methods
 * GET /checkout/payment-methods
 */
export const getPaymentMethods = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const methods = await manageCheckoutSessionUseCase.getAvailablePaymentMethods();
  respond(req, res, methods as unknown as unknown, 200);
};

/**
 * Set payment method
 * PUT /checkout/:checkoutId/payment-method
 */
export const setPaymentMethod = async (
  req: HttpRequest<Record<string, string>, unknown, PaymentMethodBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { paymentMethodId } = req.body;

  if (!paymentMethodId) {
    respondError(req, res, 'Payment method ID is required', 400);
    return;
  }

  const command = new SetPaymentMethodCommand(checkoutId, paymentMethodId);
  const useCase = setPaymentMethodUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Apply coupon code
 * POST /checkout/:checkoutId/coupon
 */
export const applyCoupon = async (req: HttpRequest<Record<string, string>, unknown, CouponBody>, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;
  const { couponCode } = req.body;

  if (!couponCode) {
    respondError(req, res, 'Coupon code is required', 400);
    return;
  }

  const command = new ApplyCouponCommand(checkoutId, couponCode);
  const useCase = applyCouponUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Remove coupon code
 * DELETE /checkout/:checkoutId/coupon
 */
export const removeCoupon = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const command = new RemoveCouponCommand(checkoutId);
  const useCase = removeCouponUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

interface LoyaltyRewardBody {
  rewardId?: string;
}

/**
 * Apply loyalty reward
 * POST /checkout/:checkoutId/loyalty-reward
 */
export const applyLoyaltyReward = async (
  req: HttpRequest<Record<string, string>, unknown, LoyaltyRewardBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { rewardId } = req.body;

  if (!rewardId) {
    respondError(req, res, 'Reward ID is required', 400);
    return;
  }

  const command = new ApplyLoyaltyRewardCommand(checkoutId, rewardId);
  const useCase = applyLoyaltyRewardUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Remove loyalty reward
 * DELETE /checkout/:checkoutId/loyalty-reward
 */
export const removeLoyaltyReward = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const command = new RemoveLoyaltyRewardCommand(checkoutId);
  const useCase = removeLoyaltyRewardUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Complete checkout and create order
 * POST /checkout/:checkoutId/complete
 */
export const completeCheckout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;
  const command = new CompleteCheckoutCommand(checkoutId);
  const useCase = completeCheckoutUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result as unknown as unknown, 201);
};

/**
 * Abandon checkout
 * POST /checkout/:checkoutId/abandon
 */
export const abandonCheckout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;
  const command = new AbandonCheckoutCommand(checkoutId);
  const useCase = abandonCheckoutUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result as unknown as unknown, 200);
};

/**
 * Set billing address
 * PUT /checkout/:checkoutId/billing-address
 */
export const setBillingAddress = async (
  req: HttpRequest<Record<string, string>, unknown, BillingAddressBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { firstName, lastName, company, addressLine1, addressLine2, city, region, postalCode, country, phone, sameAsShipping } = req.body;

  const command = new SetBillingAddressCommand({
    checkoutId: checkoutId,
    firstName: firstName,
    lastName: lastName,
    addressLine1: addressLine1,
    city: city,
    postalCode: postalCode,
    country: country,
    company: company,
    addressLine2: addressLine2,
    region: region,
    phone: phone,
    sameAsShipping: sameAsShipping,
  });

  const useCase = setBillingAddressUseCase;
  const checkout = await useCase.execute(command);

  respond(req, res, checkout as unknown as unknown, 200);
};

/**
 * Create payment intent and draft order
 * POST /checkout/:checkoutId/payment-intent
 */
export const createPaymentIntent = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;
  const customerId = req.user?.customerId || ((req.user as Record<string, unknown> | undefined)?.id as string | undefined);
  const command = new CreatePaymentIntentCommand(checkoutId, customerId);
  const useCase = createPaymentIntentUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result as unknown as unknown, 201);
};
