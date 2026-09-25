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
    return res.redirect('/signin?redirect=/checkout');
  }

  // Get or create basket
  const basketCommand = new GetOrCreateBasketCommand(customerId, sessionId);
  const basketUseCase = getOrCreateBasketUseCase;
  const basket = await basketUseCase.execute(basketCommand);

  if (!basket || !basket.items || basket.items.length === 0) {
    return res.redirect('/basket?error=' + encodeURIComponent('Your cart is empty'));
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

export const processCheckout = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  if (!customerId && !sessionId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const body = req.body as HttpRequestBody;
  const {
    shippingMethodId,
    _paymentMethod,
    billingAddress: billingAddressStr,
    shippingAddress: shippingAddressStr,
    specialInstructions,
  } = body;

  // Get or create basket
  const basketCommand = new GetOrCreateBasketCommand(customerId, sessionId);
  const basketUseCase = getOrCreateBasketUseCase;
  const basket = await basketUseCase.execute(basketCommand);

  if (!basket || !basket.items || basket.items.length === 0) {
    res.status(400).json({ success: false, message: 'Cart is empty' });
    return;
  }

  // Parse addresses
  const shippingAddress = JSON.parse(shippingAddressStr as string) as Record<string, unknown>;
  const billingAddress = billingAddressStr ? (JSON.parse(billingAddressStr as string) as Record<string, unknown>) : shippingAddress;

  // Guest checkout requires a contact email (billingEmail / guestEmail / address email)
  const customerEmail =
    (req.user?.email as string | undefined) ||
    (body.guestEmail as string | undefined) ||
    (body.billingEmail as string | undefined) ||
    (billingAddress.email as string | undefined) ||
    (shippingAddress.email as string | undefined);

  if (!customerEmail) {
    res.status(400).json({ success: false, message: 'An email address is required for checkout' });
    return;
  }

  // Get shipping method details
  const shippingMethod = await getShippingMethodDetailsUseCase.getShippingMethod(shippingMethodId as string);

  // Convert basket items to order items
  const orderItems = basket.items.map((item: Record<string, unknown>) => ({
    productId: item.productId as string,
    productVariantId: item.productVariantId as string | undefined,
    sku: item.sku as string,
    name: item.name as string,
    quantity: item.quantity as number,
    unitPriceCents: item.unitPriceCents as number,
    taxRate: item.taxRate as number | undefined,
    taxAmountCents: item.taxAmountCents as number | undefined,
    discountAmountCents: item.discountAmountCents as number | undefined,
  }));

  // Create order with proper constructor arguments
  const orderCommand = new CreateOrderCommand(
    customerId,
    customerEmail,
    orderItems,
    mapAddressFields(shippingAddress),
    mapAddressFields(billingAddress),
    basket.basketId,
    undefined,
    undefined,
    customerId,
    'web',
    basket.currency || 'USD',
    shippingAddress.phone as string,
    `${shippingAddress.firstName} ${shippingAddress.lastName}`,
    specialInstructions as string | undefined,
    Number(shippingMethod?.costCents || 0),
  );

  const orderUseCase = createOrderUseCase;
  const order = await orderUseCase.execute(orderCommand);

  // Remember guest orders on the session so the confirmation page can verify ownership
  if (!customerId && req.session) {
    const session = req.session as unknown as Record<string, unknown>;
    session.guestOrderIds = [...((session.guestOrderIds as string[] | undefined) ?? []), order.orderId];
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({
      success: true,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
    });
  } else {
    res.redirect(`/order-confirmation/${order.orderId}`);
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
      return res.redirect('/signin');
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
  const taxCommand = new CalculateOrderTaxCommand(
    basketItems?.map((item: Record<string, unknown>) => ({
      productId: item.productId as string,
      name: item.name as string,
      quantity: item.quantity as number,
      unitPriceCents: item.unitPriceCents as number,
    })) || [],
    {
      country: (shippingAddress as Record<string, unknown>).country as string,
      region: ((shippingAddress as Record<string, unknown>).state || (shippingAddress as Record<string, unknown>).region) as string,
      postalCode: (shippingAddress as Record<string, unknown>).postalCode as string,
      city: (shippingAddress as Record<string, unknown>).city as string,
    },
    shippingCostCents,
    customer?.customerId as string | undefined,
  );

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
