/**
 * Storefront Checkout Controller
 * Handles checkout process, payment, and order creation
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { getOrCreateBasketUseCase } from '../../../basket/application/useCases/wired';
import { createOrderUseCase, getOrderUseCase } from '../../../order/application/useCases/wired';
import { getCustomerUseCase } from '../../../customer/application/useCases/wired';
import { GetShippingMethodsQuery, GetShippingMethodsUseCase } from '../../../shipping/application/useCases/GetShippingMethods';
import { GetShippingMethodDetailsUseCase } from '../../../shipping/application/useCases/GetShippingMethodDetails';
import { GetOrCreateBasketCommand } from '../../../basket/application/useCases/GetOrCreateBasket';
import { CreateOrderCommand } from '../../../order/application/useCases/CreateOrder';
import { GetCustomerCommand } from '../../../customer/application/useCases/GetCustomer';
import { GetOrderCommand } from '../../../order/application/useCases/GetOrder';
import { CalculateOrderTaxCommand, CalculateOrderTaxUseCase } from '../../../tax/application/useCases/CalculateOrderTax';
// ============================================================================
// Checkout Page
// ============================================================================

export const checkout = async (req: TypedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    return res.redirect('/signin?redirect=/checkout');
  }

  const customerId = req.user.customerId;
  const sessionId = req.session?.id;

  // Get or create basket
  const basketCommand = new GetOrCreateBasketCommand(customerId, sessionId);
  const basketUseCase = getOrCreateBasketUseCase;
  const basket = await basketUseCase.execute(basketCommand);

  if (!basket || !basket.items || basket.items.length === 0) {
    return res.redirect('/basket?error=' + encodeURIComponent('Your cart is empty'));
  }

  // Get customer details
  const customerCommand = new GetCustomerCommand(customerId);
  const customerUseCase = getCustomerUseCase;
  const customer = await customerUseCase.execute(customerCommand);

  // Get shipping methods (active + visible on storefront)
  const shippingUseCase = new GetShippingMethodsUseCase();
  const shippingResult = await shippingUseCase.execute(new GetShippingMethodsQuery(true, true));

  // Calculate totals with tax
  const totals = await calculateCheckoutTotals(
    basket as unknown as Record<string, unknown>,
    customer as unknown as Record<string, unknown> | undefined,
  );

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

export const processCheckout = async (req: TypedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const customerId = req.user.customerId;
  const customerEmail = req.user.email;
  const body = req.body as RequestBody;
  const {
    shippingMethodId,
    _paymentMethod,
    billingAddress: billingAddressStr,
    shippingAddress: shippingAddressStr,
    specialInstructions,
  } = body;

  // Get or create basket
  const sessionId = req.session?.id;
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

  // Get shipping method details
  const getShippingMethodUseCase = new GetShippingMethodDetailsUseCase();
  const shippingMethod = await getShippingMethodUseCase.getShippingMethod(shippingMethodId as string);

  // Convert basket items to order items
  const orderItems = basket.items.map((item: Record<string, unknown>) => ({
    productId: item.productId as string,
    productVariantId: item.productVariantId as string | undefined,
    sku: item.sku as string,
    name: item.name as string,
    quantity: item.quantity as number,
    unitPrice: item.unitPrice as number,
    taxRate: item.taxRate as number | undefined,
    taxAmount: item.taxAmount as number | undefined,
    discountAmount: item.discountAmount as number | undefined,
  }));

  // Create order with proper constructor arguments
  const orderCommand = new CreateOrderCommand(
    customerId as string,
    customerEmail as string,
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
    parseFloat(shippingMethod?.cost || '0'),
  );

  const orderUseCase = createOrderUseCase;
  const order = await orderUseCase.execute(orderCommand);

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

export const orderConfirmation = async (req: TypedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    return res.redirect('/signin');
  }

  const { orderId } = req.params;
  const customerId = req.user.customerId;

  // Get order details using GetOrderUseCase
  const orderCommand = new GetOrderCommand(orderId, undefined, customerId);
  const orderUseCase = getOrderUseCase;
  const order = await orderUseCase.execute(orderCommand);

  if (!order) {
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
      subtotal: order.subtotal.toFixed(2),
      tax: order.taxTotal.toFixed(2),
      shipping: order.shippingTotal.toFixed(2),
      total: order.totalAmount.toFixed(2),
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
  const subtotal =
    typeof basket.subtotal === 'number'
      ? basket.subtotal
      : basketItems?.reduce((sum: number, item: Record<string, unknown>) => {
          return sum + ((item.lineTotal as number) ?? (item.unitPrice as number) * (item.quantity as number));
        }, 0) || 0;

  const shippingCost = shippingMethod ? parseFloat((shippingMethod.cost as string) || '0') : 0;

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
      unitPrice: item.unitPrice as number,
    })) || [],
    {
      country: (shippingAddress as Record<string, unknown>).country as string,
      region: ((shippingAddress as Record<string, unknown>).state || (shippingAddress as Record<string, unknown>).region) as string,
      postalCode: (shippingAddress as Record<string, unknown>).postalCode as string,
      city: (shippingAddress as Record<string, unknown>).city as string,
    },
    shippingCost,
    customer?.customerId as string | undefined,
  );

  const taxUseCase = new CalculateOrderTaxUseCase();
  const taxResult = await taxUseCase.execute(taxCommand);

  const total = subtotal + taxResult.taxAmount + shippingCost;

  return {
    subtotal: subtotal.toFixed(2),
    tax: taxResult.taxAmount.toFixed(2),
    shipping: shippingCost.toFixed(2),
    total: total.toFixed(2),
    taxRate: taxResult.taxRate,
  };
}
