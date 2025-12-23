/**
 * Storefront Checkout Controller
 * Handles checkout process, payment, and order creation
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { storefrontRespond } from '../../respond';
import BasketRepo from '../../../modules/basket/infrastructure/repositories/BasketRepository';
import OrderRepo from '../../../modules/order/infrastructure/repositories/OrderRepository';
import CustomerRepo from '../../../modules/customer/infrastructure/repositories/CustomerRepository';
import { GetShippingMethodsQuery, GetShippingMethodsUseCase } from '../../../modules/shipping/application/useCases/GetShippingMethods';
import { GetOrCreateBasketCommand, GetOrCreateBasketUseCase } from '../../../modules/basket/application/useCases/GetOrCreateBasket';
import { CreateOrderCommand, CreateOrderUseCase } from '../../../modules/order/application/useCases/CreateOrder';
import { GetCustomerCommand, GetCustomerUseCase } from '../../../modules/customer/useCases/GetCustomer';
import { GetOrderCommand, GetOrderUseCase } from '../../../modules/order/application/useCases/GetOrder';
import * as shippingMethodRepo from '../../../modules/shipping/repos/shippingMethodRepo';
import * as shippingRateRepo from '../../../modules/shipping/repos/shippingRateRepo';
import { CalculateOrderTaxCommand, CalculateOrderTaxUseCase } from '../../../modules/tax/application/useCases/CalculateOrderTax';
// ============================================================================
// Checkout Page
// ============================================================================

export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin?redirect=/checkout');
    }

    const customerId = (req as any).user.customerId;
    const sessionId = (req as any).session?.id;

    // Get or create basket
    const basketCommand = new GetOrCreateBasketCommand(customerId, sessionId);
    const basketUseCase = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await basketUseCase.execute(basketCommand);

    if (!basket || !basket.items || basket.items.length === 0) {
      return res.redirect('/basket?error=' + encodeURIComponent('Your cart is empty'));
    }

    // Get customer details
    const customerCommand = new GetCustomerCommand(customerId);
    const customerUseCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await customerUseCase.execute(customerCommand);

    // Get shipping methods (active + visible on storefront)
    const shippingUseCase = new GetShippingMethodsUseCase();
    const shippingResult = await shippingUseCase.execute(new GetShippingMethodsQuery(true, true));

    // Calculate totals with tax
    const totals = await calculateCheckoutTotals(basket, customer);

    storefrontRespond(req, res, 'shop/checkout', {
      pageName: 'Checkout',
      basket,
      customer,
      shippingMethods: shippingResult.methods || [],
      totals,
      user: req.user,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load checkout',
      user: req.user,
    });
  }
};

// ============================================================================
// Process Checkout
// ============================================================================

export const processCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const customerId = (req as any).user.customerId;
    const customerEmail = (req as any).user.email;
    const {
      shippingMethodId,
      paymentMethod,
      billingAddress: billingAddressStr,
      shippingAddress: shippingAddressStr,
      specialInstructions,
    } = req.body;

    // Get or create basket
    const sessionId = (req as any).session?.id;
    const basketCommand = new GetOrCreateBasketCommand(customerId, sessionId);
    const basketUseCase = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await basketUseCase.execute(basketCommand);

    if (!basket || !basket.items || basket.items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart is empty' });
      return;
    }

    // Parse addresses
    const shippingAddress = JSON.parse(shippingAddressStr);
    const billingAddress = billingAddressStr ? JSON.parse(billingAddressStr) : shippingAddress;

    // Get shipping method details
    const shippingMethod = await getShippingMethod(shippingMethodId);

    // Convert basket items to order items
    const orderItems = basket.items.map((item: any) => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    // Create order with proper constructor arguments
    const orderCommand = new CreateOrderCommand(
      customerId,
      customerEmail,
      orderItems,
      {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address1: shippingAddress.addressLine1 || shippingAddress.address1,
        address2: shippingAddress.addressLine2 || shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        countryCode: shippingAddress.countryCode || shippingAddress.country,
        phone: shippingAddress.phone,
      },
      {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        address1: billingAddress.addressLine1 || billingAddress.address1,
        address2: billingAddress.addressLine2 || billingAddress.address2,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
        countryCode: billingAddress.countryCode || billingAddress.country,
        phone: billingAddress.phone,
      },
      basket.basketId,
      basket.currency || 'USD',
      shippingAddress.phone,
      `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      specialInstructions,
      parseFloat(shippingMethod?.cost || '0'),
    );

    const orderUseCase = new CreateOrderUseCase(OrderRepo);
    const order = await orderUseCase.execute(orderCommand);

    // Clear the basket after successful order creation
    // (This would be handled by the order creation use case in a real implementation)

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({
        success: true,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
      });
    } else {
      res.redirect(`/order-confirmation/${order.orderId}`);
    }
  } catch (error: any) {
    logger.error('Error:', error);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.redirect('/checkout?error=' + encodeURIComponent(error.message || 'Failed to process checkout'));
    }
  }
};

// ============================================================================
// Order Confirmation
// ============================================================================

export const orderConfirmation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin');
    }

    const { orderId } = req.params;
    const customerId = (req as any).user.customerId;

    // Get order details using GetOrderUseCase
    const orderCommand = new GetOrderCommand(orderId, undefined, customerId);
    const orderUseCase = new GetOrderUseCase(OrderRepo);
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
  } catch (error: any) {
    logger.error('Error:', error);

    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load order confirmation',
      user: req.user,
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

async function calculateCheckoutTotals(basket: any, customer: any, shippingMethod?: any) {
  // Use basket.subtotal if available, otherwise calculate from items
  const subtotal =
    typeof basket.subtotal === 'number'
      ? basket.subtotal
      : basket.items?.reduce((sum: number, item: any) => {
          return sum + (item.lineTotal ?? item.unitPrice * item.quantity);
        }, 0) || 0;

  const shippingCost = shippingMethod ? parseFloat(shippingMethod.cost || 0) : 0;

  // Use default shipping address or fallback
  const shippingAddress = customer?.addresses?.find((addr: any) => addr.isDefault && addr.addressType === 'shipping') ||
    customer?.addresses?.[0] || { country: 'US', region: '', postalCode: '', city: '' };

  // Calculate tax using the tax service
  const taxCommand = new CalculateOrderTaxCommand(
    basket.items?.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })) || [],
    {
      country: shippingAddress.country,
      region: shippingAddress.state || shippingAddress.region,
      postalCode: shippingAddress.postalCode,
      city: shippingAddress.city,
    },
    shippingCost,
    customer?.customerId,
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

async function getShippingMethod(shippingMethodId: string) {
  if (!shippingMethodId) {
    // Return default shipping method if none specified
    const defaultMethod = await shippingMethodRepo.findDefault();
    if (defaultMethod) {
      // Get the rate for this method
      const rates = await shippingRateRepo.findByMethod(defaultMethod.shippingMethodId, true);
      const rate = rates.length > 0 ? rates[0] : null;
      return {
        shippingMethodId: defaultMethod.shippingMethodId,
        name: defaultMethod.name,
        cost: rate?.baseRate || '0.00',
        estimatedDeliveryDays: defaultMethod.estimatedDeliveryDays,
      };
    }
    return { cost: '0.00', name: 'Standard Shipping' };
  }

  const method = await shippingMethodRepo.findById(shippingMethodId);
  if (!method) {
    return { cost: '0.00', name: 'Standard Shipping' };
  }

  // Get the rate for this method
  const rates = await shippingRateRepo.findByMethod(shippingMethodId, true);
  const rate = rates.length > 0 ? rates[0] : null;

  return {
    shippingMethodId: method.shippingMethodId,
    name: method.name,
    cost: rate?.baseRate || '0.00',
    estimatedDeliveryDays: method.estimatedDeliveryDays,
  };
}
