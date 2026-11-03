import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Storefront Checkout Controller
 * Handles checkout process, payment, and order creation
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { getOrCreateBasketUseCase } from '../../../basket/application/useCases/wired';
import { createOrderUseCase, getOrderUseCase } from '../../../order/application/useCases/wired';
import { getCustomerUseCase } from '../../../customer/application/useCases/wired';
import { GetShippingMethodsQuery } from '../../../shipping/application/useCases/GetShippingMethods';
import { getShippingMethodsUseCase, getShippingMethodDetailsUseCase } from '../../../shipping/application/wired';
import { GetOrCreateBasketCommand } from '../../../basket/application/useCases/GetOrCreateBasket';
import { CreateOrderCommand } from '../../../order/application/useCases/CreateOrder';
import { GetCustomerCommand } from '../../../customer/application/useCases/GetCustomer';
import { GetOrderCommand } from '../../../order/application/useCases/GetOrder';
import { CalculateOrderTaxCommand } from '../../../tax/application/useCases/CalculateOrderTax';
import { calculateOrderTaxUseCase } from '../../../tax/application/wired';
// ============================================================================
// Checkout Page
// ============================================================================

export const checkout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  // Guests check out by session; without a session there is no basket to check out
  if (!customerId && !sessionId) {
    return redirectResponse(res, '/signin?redirect=/checkout');
  }

  // Get or create basket
  const basketCommand = new GetOrCreateBasketCommand(customerId, sessionId);
  const basketUseCase = getOrCreateBasketUseCase;
  const basket = await basketUseCase.execute(basketCommand);

  if (!basket || !basket.items || basket.items.length === 0) {
    return redirectResponse(res, '/basket?error=' + encodeURIComponent('Your cart is empty'));
  }

  // Get customer details (authenticated shoppers only)
  let customer: Record<string, unknown> | undefined;
  if (customerId) {
    const customerCommand = new GetCustomerCommand(customerId);
    const customerUseCase = getCustomerUseCase;
    customer = (await customerUseCase.execute(customerCommand)) as unknown as Record<string, unknown> | undefined;
  }

  // Get shipping methods (active + visible on storefront)
  const shippingResult = await getShippingMethodsUseCase.execute(new GetShippingMethodsQuery(true, true));

  // Calculate totals with tax
  const totals = await calculateCheckoutTotals(basket as unknown as Record<string, unknown>, customer);

  storefrontRespond(req, res, 'shop/checkout', {
    pageName: 'Checkout',
    basket,
    customer,
    shippingMethods: shippingResult.methods || [],
    totals,
    user: req.user,
  });
};

// ============================================================================
// Process Checkout
// ============================================================================

function mapAddressFields(addr: Record<string, unknown>) {
  return {
    firstName: addr.firstName as string,
    lastName: addr.lastName as string,
    address1: (addr.addressLine1 || addr.address1) as string,
    address2: (addr.addressLine2 || addr.address2) as string,
    city: addr.city as string,
    state: addr.state as string,
    postalCode: addr.postalCode as string,
    country: addr.country as string,
    countryCode: (addr.countryCode || addr.country) as string,
    phone: addr.phone as string,
  };
}

/** Parse the JSON-encoded address fields; billing falls back to shipping. */
function parseCheckoutAddresses(
  body: HttpRequestBody,
): { shippingAddress: Record<string, unknown>; billingAddress: Record<string, unknown> } | null {
  try {
    const shippingAddress = JSON.parse(body.shippingAddress as string) as Record<string, unknown>;
    const billingAddress = body.billingAddress ? (JSON.parse(body.billingAddress as string) as Record<string, unknown>) : shippingAddress;
    return { shippingAddress, billingAddress };
  } catch {
    return null;
  }
}

/** Guest checkout requires a contact email (billingEmail / guestEmail / address email). */
function resolveCustomerEmail(
  req: HttpRequest,
  body: HttpRequestBody,
  billingAddress: Record<string, unknown>,
  shippingAddress: Record<string, unknown>,
): string | undefined {
  return (
    (req.user?.email as string | undefined) ||
    (body.guestEmail as string | undefined) ||
    (body.billingEmail as string | undefined) ||
    (billingAddress.email as string | undefined) ||
    (shippingAddress.email as string | undefined)
  );
}

/** Convert basket items to order items. */
function toOrderItems(items: unknown[]) {
  return items.map(item => {
    const i = item as Record<string, unknown>;
    return {
      productId: i.productId as string,
      productVariantId: i.productVariantId as string | undefined,
      sku: i.sku as string,
      name: i.name as string,
      quantity: i.quantity as number,
      unitPriceCents: i.unitPriceCents as number,
      taxRate: i.taxRate as number | undefined,
      taxAmountCents: i.taxAmountCents as number | undefined,
      discountAmountCents: i.discountAmountCents as number | undefined,
    };
  });
}

function buildOrderCommand(input: {
  customerId?: string;
  customerEmail: string;
  basket: { basketId: string; currency?: string; items: unknown[] };
  body: HttpRequestBody;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  shippingCostCents: number;
}): CreateOrderCommand {
  return new CreateOrderCommand({
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    items: toOrderItems(input.basket.items),
    shippingAddress: mapAddressFields(input.shippingAddress),
    billingAddress: mapAddressFields(input.billingAddress),
    basketId: input.basket.basketId,
    createdByUserId: input.customerId,
    orderSource: 'web',
    currencyCode: input.basket.currency || 'USD',
    customerPhone: input.shippingAddress.phone as string,
    customerName: `${input.shippingAddress.firstName} ${input.shippingAddress.lastName}`,
    customerNotes: input.body.specialInstructions as string | undefined,
    shippingTotalCents: input.shippingCostCents,
    metadata: input.body.vatNumber ? { vatNumber: String(input.body.vatNumber).trim() } : undefined,
  });
}

/** Load the shopper's basket; returns null when missing or empty. */
async function getNonEmptyBasket(customerId: string | undefined, sessionId: string | undefined) {
  const basket = await getOrCreateBasketUseCase.execute(new GetOrCreateBasketCommand(customerId, sessionId));
  return basket && basket.items && basket.items.length > 0 ? basket : null;
}

/** Remember guest orders on the session so the confirmation page can verify ownership. */
function rememberGuestOrder(req: HttpRequest, orderId: string): void {
  if (!req.session) return;
  const session = req.session as unknown as Record<string, unknown>;
  session.guestOrderIds = [...((session.guestOrderIds as string[] | undefined) ?? []), orderId];
}

export const processCheckout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  if (!customerId && !sessionId) {
    jsonResponse(res, 401, { success: false, message: 'Not authenticated' });
    return;
  }

  const body = req.body as HttpRequestBody;

  const addresses = parseCheckoutAddresses(body);
  if (!addresses) {
    jsonResponse(res, 400, { success: false, message: 'Invalid shipping or billing address' });
    return;
  }

  const customerEmail = resolveCustomerEmail(req, body, addresses.billingAddress, addresses.shippingAddress);
  if (!customerEmail) {
    jsonResponse(res, 400, { success: false, message: 'An email address is required for checkout' });
    return;
  }

  const basket = await getNonEmptyBasket(customerId, sessionId);
  if (!basket) {
    jsonResponse(res, 400, { success: false, message: 'Cart is empty' });
    return;
  }

  // Get shipping method details
  const shippingMethod = await getShippingMethodDetailsUseCase.getShippingMethod(body.shippingMethodId as string);

  const orderCommand = buildOrderCommand({
    customerId,
    customerEmail,
    basket,
    body,
    shippingAddress: addresses.shippingAddress,
    billingAddress: addresses.billingAddress,
    shippingCostCents: Number(shippingMethod?.costCents || 0),
  });
  const order = await createOrderUseCase.execute(orderCommand);

  if (!customerId) {
    rememberGuestOrder(req, order.orderId);
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    jsonResponse(res, 200, {
      success: true,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
    });
  } else {
    redirectResponse(res, `/order-confirmation/${order.orderId}`);
  }
};

// ============================================================================
// Order Confirmation
// ============================================================================

export const orderConfirmation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const customerId = req.user?.customerId;

  if (!customerId) {
    // Guests may only view orders this session placed (marker set by processCheckout)
    const session = req.session as unknown as Record<string, unknown> | undefined;
    const guestOrderIds = (session?.guestOrderIds as string[] | undefined) ?? [];
    if (!guestOrderIds.includes(orderId)) {
      return redirectResponse(res, '/signin');
    }
  }

  // Get order details using GetOrderUseCase
  const orderCommand = new GetOrderCommand(orderId, undefined, customerId);
  const orderUseCase = getOrderUseCase;
  const order = await orderUseCase.execute(orderCommand);

  if (!order || (!customerId && order.customerId)) {
    storefrontRespond(req, res, '404', {
      pageName: 'Order Not Found',
      user: req.user,
    });
    return;
  }

  // Format totals for display
  const orderWithTotals = {
    ...order,
    totals: {
      subtotal: (order.subtotalCents / 100).toFixed(2),
      tax: (order.taxTotalCents / 100).toFixed(2),
      shipping: (order.shippingTotalCents / 100).toFixed(2),
      total: (order.totalAmountCents / 100).toFixed(2),
    },
  };

  storefrontRespond(req, res, 'shop/order-confirmation', {
    pageName: 'Order Confirmation',
    order: orderWithTotals,
    user: req.user,
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

async function calculateCheckoutTotals(
  basket: Record<string, unknown>,
  customer: Record<string, unknown> | undefined,
  shippingMethod?: Record<string, unknown>,
) {
  const basketItems = basket.items as Record<string, unknown>[] | undefined;
  // Use basket.subtotal if available, otherwise calculate from items
  const subtotalCents =
    typeof basket.subtotalCents === 'number'
      ? basket.subtotalCents
      : basketItems?.reduce((sum: number, item: Record<string, unknown>) => {
          return sum + ((item.lineTotalCents as number) ?? (item.unitPriceCents as number) * (item.quantity as number));
        }, 0) || 0;

  const shippingCostCents = shippingMethod ? Number(shippingMethod.costCents || 0) : 0;

  // Use default shipping address or fallback
  const customerAddresses = customer?.addresses as Record<string, unknown>[] | undefined;
  const shippingAddress = customerAddresses?.find((addr: Record<string, unknown>) => addr.isDefault && addr.addressType === 'shipping') ||
    customerAddresses?.[0] || { country: 'US', region: '', postalCode: '', city: '' };

  // Calculate tax using the tax service
  const taxCommand = new CalculateOrderTaxCommand({
    items:
      basketItems?.map((item: Record<string, unknown>) => ({
        productId: item.productId as string,
        name: item.name as string,
        quantity: item.quantity as number,
        unitPriceCents: item.unitPriceCents as number,
      })) || [],
    shippingAddress: {
      country: (shippingAddress as Record<string, unknown>).country as string,
      region: ((shippingAddress as Record<string, unknown>).state || (shippingAddress as Record<string, unknown>).region) as string,
      postalCode: (shippingAddress as Record<string, unknown>).postalCode as string,
      city: (shippingAddress as Record<string, unknown>).city as string,
    },
    shippingAmountCents: shippingCostCents,
    customerId: customer?.customerId as string | undefined,
  });

  const taxUseCase = calculateOrderTaxUseCase;
  const taxResult = await taxUseCase.execute(taxCommand);

  const totalCents = subtotalCents + taxResult.taxAmountCents + shippingCostCents;

  return {
    subtotal: (subtotalCents / 100).toFixed(2),
    tax: (taxResult.taxAmountCents / 100).toFixed(2),
    shipping: (shippingCostCents / 100).toFixed(2),
    total: (totalCents / 100).toFixed(2),
    taxRate: taxResult.taxRate,
  };
}
