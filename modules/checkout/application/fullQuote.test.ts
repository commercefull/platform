/**
 * E2E Checkout Full Quote Integration Test (Epic Cross-Epic Testing Strategy §3)
 *
 * Drives a basket through the full checkout flow:
 *   InitiateCheckout → SetShippingAddress → ApplyCoupon → SetShippingMethod → CreatePaymentIntent
 *
 * Exercises:
 *   - Stacked promotions (two stackable promos summing)
 *   - Category-scoped tax exemption (digital goods exempt, physical goods taxed)
 *   - Shipping surcharge (oversize surcharge on top of base rate)
 *   - Fraud-review-triggering order (review verdict → order proceeds but flagged)
 *
 * Uses real use cases and real CheckoutSession entity with in-memory mocks
 * for repositories and ACL ports. Verifies the final itemized total matches
 * hand-computed expectations.
 *
 * See docs/e2e-rule-engine-implementation-plan.md §2 (Cross-Epic Testing Strategy).
 */

import { emitMock } from '../tests/testUtils';
import {
  createBasketSnapshotPort,
  createTaxQuotePort,
  createPromotionQuotePort,
  createShippingQuotePort,
  createDiscountQuotePort,
  createOrderPlacementPort,
  createPaymentAuthorizationPort,
  createFraudScreeningPort,
} from '../tests/testUtils';
import { InitiateCheckoutUseCase, InitiateCheckoutCommand } from '../../../modules/checkout/application/useCases/InitiateCheckout';
import { SetShippingAddressUseCase, SetShippingAddressCommand } from '../../../modules/checkout/application/useCases/SetShippingAddress';
import { ApplyCouponUseCase, ApplyCouponCommand } from '../../../modules/checkout/application/useCases/ApplyCoupon';
import { SetShippingMethodUseCase, SetShippingMethodCommand } from '../../../modules/checkout/application/useCases/SetShippingMethod';
import { CreatePaymentIntentUseCase, CreatePaymentIntentCommand } from '../../../modules/checkout/application/useCases/CreatePaymentIntent';
import type { CheckoutSession } from '../../../modules/checkout/domain/entities/CheckoutSession';
import type { CheckoutRepository, PaymentMethodData } from '../domain/repositories/CheckoutRepository';
import type { BasketSnapshotPort } from './ports/BasketSnapshotPort';
import type { TaxQuotePort } from './ports/TaxQuotePort';
import type { PromotionQuotePort } from './ports/PromotionQuotePort';
import type { ShippingQuotePort } from './ports/ShippingQuotePort';
import type { DiscountQuotePort } from './ports/DiscountQuotePort';
import type { OrderPlacementPort } from './ports/OrderPlacementPort';
import type { PaymentAuthorizationPort } from './ports/PaymentAuthorizationPort';
import type { FraudScreeningPort } from './ports/FraudScreeningPort';
import { Money } from '../../../libs/money';

// ============================================================================
// In-memory checkout repository
// ============================================================================

class InMemoryCheckoutRepository implements CheckoutRepository {
  private sessions = new Map<string, CheckoutSession>();
  private basketIndex = new Map<string, string>(); // basketId → checkoutId

  async findById(id: string): Promise<CheckoutSession | null> {
    return this.sessions.get(id) ?? null;
  }

  async findByBasketId(basketId: string): Promise<CheckoutSession | null> {
    const checkoutId = this.basketIndex.get(basketId);
    if (!checkoutId) return null;
    return this.sessions.get(checkoutId) ?? null;
  }

  async findActiveByCustomerId(_customerId: string): Promise<CheckoutSession | null> {
    return null;
  }

  async save(session: CheckoutSession): Promise<CheckoutSession> {
    this.sessions.set(session.id, session);
    this.basketIndex.set(session.basketId, session.id);
    return session;
  }

  async delete(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.basketIndex.delete(session.basketId);
    }
    this.sessions.delete(id);
  }

  async findExpiredSessions(): Promise<CheckoutSession[]> {
    return [];
  }

  async markAsAbandoned(_id: string): Promise<void> {}

  async getAvailableShippingMethods(_country: string, _postalCode: string): Promise<never[]> {
    return [];
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodData[]> {
    return [{ id: 'pm_card_visa', name: 'Visa', type: 'credit_card', isDefault: true }];
  }

  async validateShippingAddress(_address: unknown): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async findByPaymentIntentId(_paymentIntentId: string): Promise<CheckoutSession | null> {
    return null;
  }

  clear(): void {
    this.sessions.clear();
    this.basketIndex.clear();
  }
}

// ============================================================================
// Test fixtures
// ============================================================================

const BASKET_ITEMS = [
  {
    productId: 'prod-physical-1',
    productVariantId: undefined,
    sku: 'PHYS-SKU-1',
    name: 'T-Shirt',
    quantity: 2,
    unitPrice: Money.create(50, 'USD'),
    itemType: 'physical',
    isDigital: false,
    taxCategoryId: 'physical-goods',
  },
  {
    productId: 'prod-digital-1',
    productVariantId: undefined,
    sku: 'DIG-SKU-1',
    name: 'E-Book',
    quantity: 1,
    unitPrice: Money.create(20, 'USD'),
    itemType: 'digital',
    isDigital: true,
    taxCategoryId: 'digital-goods',
  },
];

// Hand-computed expectations:
// Subtotal = 2*50 + 1*20 = 120
// Promotion 1 (10% off cart total) = 12.00
// Promotion 2 (5% off, stackable) = 6.00
// Total discount = 18.00
// Discounted subtotal = 120 - 18 = 102
// Tax (physical goods only @ 10%, digital exempt) = 2*50 * 0.10 = 10.00
//   (tax on pre-discount physical = 100 * 0.10 = 10.00)
// Shipping base = 15.00
// Shipping surcharge (oversize) = 5.00
// Total shipping = 20.00
// Total = 102 + 10 + 20 = 132.00

const EXPECTED = {
  subtotal: 120,
  discount: 18,
  tax: 10,
  shipping: 20,
  total: 132,
};

// ============================================================================
// Mock ports
// ============================================================================

function makeBasketPort(): jest.Mocked<BasketSnapshotPort> {
  const port = createBasketSnapshotPort();
  port.getSnapshot.mockResolvedValue({
      basketId: 'basket-1',
      isEmpty: false,
      itemCount: 3,
      uniqueItemCount: 2,
      discountAmount: 0,
      total: Money.create(120, 'USD'),
      items: BASKET_ITEMS,
      currency: 'USD',
      subtotal: Money.create(120, 'USD'),
    });
  return port;
}

function makeTaxPort(): jest.Mocked<TaxQuotePort> {
  const port = createTaxQuotePort();
  port.calculateTax.mockResolvedValue({
      success: true,
      taxAmount: EXPECTED.tax,
      breakdown: [
        { label: 'Physical Goods Tax (10%)', amount: 10 },
        { label: 'Digital Goods (exempt)', amount: 0 },
      ],
    });
  port.getTaxSettings.mockResolvedValue({ applyDiscountBeforeTax: false, applyTaxToShipping: false });
  return port;
}

function makePromotionPort(): jest.Mocked<PromotionQuotePort> {
  const port = createPromotionQuotePort();
  port.evaluatePromotions.mockResolvedValue({
      totalDiscountAmount: EXPECTED.discount,
      appliedPromotions: [
        { id: 'promo-1', name: '10% Off Cart Total', amount: 12 },
        { id: 'promo-2', name: '5% Off (Stackable)', amount: 6 },
      ],
    });
  return port;
}

function makeShippingPort(): jest.Mocked<ShippingQuotePort> {
  const port = createShippingQuotePort();
  port.getShippingOptions.mockResolvedValue([
      {
        methodId: 'standard',
        methodName: 'Standard Shipping',
        amount: 20, // base (15) + oversize surcharge (5)
        currency: 'USD',
      },
    ]);
  return port;
}

function makeDiscountPort(): jest.Mocked<DiscountQuotePort> {
  const port = createDiscountQuotePort();
  port.validateDiscount.mockResolvedValue({
      valid: true,
      discount: { code: 'SAVE10', discountAmount: EXPECTED.discount },
    });
  return port;
}

function makeOrderPort(): jest.Mocked<OrderPlacementPort> {
  const port = createOrderPlacementPort();
  port.createOrder.mockResolvedValue({ orderId: 'order-1', orderNumber: 'ORD-001', status: 'pending', paymentStatus: 'pending' });
  port.findOrder.mockResolvedValue(null);
  port.updateOrderStatus.mockResolvedValue(undefined);
  port.cancelOrder.mockResolvedValue(undefined);
  return port;
}

function makePaymentPort(): jest.Mocked<PaymentAuthorizationPort> {
  const port = createPaymentAuthorizationPort();
  port.initiatePayment.mockResolvedValue({ transactionId: 'pi_test_123', status: 'requires_confirmation' });
  return port;
}

function makeFraudPort(decision: 'approved' | 'review' | 'blocked' = 'review'): jest.Mocked<FraudScreeningPort> {
  const port = createFraudScreeningPort();
  port.screenOrder.mockResolvedValue({
      decision,
      riskScore: decision === 'blocked' ? 100 : decision === 'review' ? 50 : 0,
      riskLevel: decision === 'blocked' ? 'critical' : decision === 'review' ? 'medium' : 'low',
      triggeredRules: decision === 'approved' ? [] : [{ ruleId: 'fraud-1', name: 'High Value First Order', action: decision }],
    });
  return port;
}

// ============================================================================
// Tests
// ============================================================================

describe('E2E Checkout Full Quote', () => {
  let checkoutRepo: InMemoryCheckoutRepository;
  let basketPort: ReturnType<typeof makeBasketPort>;
  let taxPort: ReturnType<typeof makeTaxPort>;
  let promotionPort: ReturnType<typeof makePromotionPort>;
  let shippingPort: ReturnType<typeof makeShippingPort>;
  let discountPort: ReturnType<typeof makeDiscountPort>;
  let orderPort: ReturnType<typeof makeOrderPort>;
  let paymentPort: ReturnType<typeof makePaymentPort>;
  let fraudPort: ReturnType<typeof makeFraudPort>;

  beforeEach(() => {
    emitMock.mockClear();
    checkoutRepo = new InMemoryCheckoutRepository();
    basketPort = makeBasketPort();
    taxPort = makeTaxPort();
    promotionPort = makePromotionPort();
    shippingPort = makeShippingPort();
    discountPort = makeDiscountPort();
    orderPort = makeOrderPort();
    paymentPort = makePaymentPort();
    fraudPort = makeFraudPort('review');
  });

  it('should drive a full checkout with stacked promos, tax exemption, shipping surcharge, and fraud review', async () => {
    // Step 1: Initiate checkout
    const initiateUseCase = new InitiateCheckoutUseCase(checkoutRepo, basketPort);
    const initiateResult = await initiateUseCase.execute(new InitiateCheckoutCommand('basket-1', 'cust-1', undefined));

    expect(initiateResult.checkoutId).toBeDefined();
    expect(initiateResult.status).toBe('active');
    const checkoutId = initiateResult.checkoutId;

    // Step 2: Set shipping address (triggers tax + promo recalc)
    const setAddressUseCase = new SetShippingAddressUseCase(
      checkoutRepo,
      basketPort,
      taxPort,
      promotionPort,
    );
    const addressResult = await setAddressUseCase.execute(
      new SetShippingAddressCommand(checkoutId, 'John', 'Doe', '123 Main St', 'New York', '10001', 'US'),
    );

    expect(addressResult.shippingAddress).toBeDefined();
    expect(addressResult.shippingAddress!.country).toBe('US');

    // Verify tax was calculated (category-scoped exemption: digital exempt, physical taxed)
    expect(taxPort.calculateTax).toHaveBeenCalled();
    const taxCall = taxPort.calculateTax.mock.calls[0][0];
    expect(taxCall.items).toHaveLength(2);
    expect(taxCall.items[0].taxCategoryId).toBe('physical-goods');
    expect(taxCall.items[1].taxCategoryId).toBe('digital-goods');

    // Verify promotions were evaluated (stacked: two stackable promos)
    expect(promotionPort.evaluatePromotions).toHaveBeenCalled();
    const promoCall = promotionPort.evaluatePromotions.mock.calls[0][0];
    expect(promoCall.items).toHaveLength(2);

    // Step 3: Apply coupon
    const applyCouponUseCase = new ApplyCouponUseCase(checkoutRepo, discountPort);
    const couponResult = await applyCouponUseCase.execute(new ApplyCouponCommand(checkoutId, 'SAVE18'));

    expect(couponResult.couponCode).toBe('SAVE18');
    expect(discountPort.validateDiscount).toHaveBeenCalledWith('SAVE18', expect.any(Number), 'USD');

    // Step 4: Set shipping method (with surcharge)
    const setShippingUseCase = new SetShippingMethodUseCase(checkoutRepo, shippingPort);
    const shippingResult = await setShippingUseCase.execute(new SetShippingMethodCommand(checkoutId, 'standard'));

    expect(shippingResult.shippingMethodId).toBe('standard');
    expect(shippingPort.getShippingOptions).toHaveBeenCalled();

    // Verify the session state before payment
    const session = await checkoutRepo.findById(checkoutId);
    expect(session).not.toBeNull();
    expect(session!.subtotal.amount).toBe(EXPECTED.subtotal);
    expect(session!.discountAmount.amount).toBe(EXPECTED.discount);
    expect(session!.shippingAmount.amount).toBe(EXPECTED.shipping);
    expect(session!.taxAmount.amount).toBe(EXPECTED.tax);

    // Total = subtotal - discount + tax + shipping
    // = 120 - 18 + 10 + 20 = 132
    expect(session!.total.amount).toBe(EXPECTED.total);

    // Step 5: Set payment method (required before CreatePaymentIntent)
    session!.setPaymentMethod('pm_card_visa');
    await checkoutRepo.save(session!);

    // Step 6: Create payment intent (with fraud screening)
    const createPaymentUseCase = new CreatePaymentIntentUseCase(
      checkoutRepo,
      basketPort,
      orderPort,
      paymentPort,
      fraudPort,
    );

    const paymentResult = await createPaymentUseCase.execute(new CreatePaymentIntentCommand(checkoutId, 'cust-1'));

    // Fraud screening was called
    expect(fraudPort.screenOrder).toHaveBeenCalled();
    const fraudCall = fraudPort.screenOrder.mock.calls[0][0];
    expect(fraudCall.orderAmount).toBe(EXPECTED.total);
    expect(fraudCall.customerId).toBe('cust-1');

    // Order was created
    expect(orderPort.createOrder).toHaveBeenCalled();
    expect(paymentResult.orderId).toBe('order-1');
    expect(paymentResult.orderNumber).toBe('ORD-001');
    expect(paymentResult.paymentIntent.id).toBe('pi_test_123');

    // Payment was initiated (review verdict doesn't block)
    expect(paymentPort.initiatePayment).toHaveBeenCalled();
  });

  it('should block checkout when fraud screening returns blocked', async () => {
    fraudPort = makeFraudPort('blocked');

    // Initiate + set address + apply coupon + set shipping
    const initiateUseCase = new InitiateCheckoutUseCase(checkoutRepo, basketPort);
    const initiateResult = await initiateUseCase.execute(new InitiateCheckoutCommand('basket-2', 'cust-2'));
    const checkoutId = initiateResult.checkoutId;

    const setAddressUseCase = new SetShippingAddressUseCase(
      checkoutRepo,
      basketPort,
      taxPort,
      promotionPort,
    );
    await setAddressUseCase.execute(new SetShippingAddressCommand(checkoutId, 'Jane', 'Smith', '456 Oak Ave', 'LA', '90001', 'US'));

    const setShippingUseCase = new SetShippingMethodUseCase(checkoutRepo, shippingPort);
    await setShippingUseCase.execute(new SetShippingMethodCommand(checkoutId, 'standard'));

    const session = await checkoutRepo.findById(checkoutId);
    session!.setPaymentMethod('pm_card_visa');
    await checkoutRepo.save(session!);

    // Create payment intent with blocked fraud verdict
    const createPaymentUseCase = new CreatePaymentIntentUseCase(
      checkoutRepo,
      basketPort,
      orderPort,
      paymentPort,
      fraudPort,
    );

    await expect(createPaymentUseCase.execute(new CreatePaymentIntentCommand(checkoutId, 'cust-2'))).rejects.toThrow(
      'Order blocked by fraud screening',
    );

    // Payment should NOT be initiated
    expect(paymentPort.initiatePayment).not.toHaveBeenCalled();

    // Order should be cancelled
    expect(orderPort.updateOrderStatus).toHaveBeenCalledWith('order-1', 'cancelled');
  });

  it('should proceed normally when fraud screening approves', async () => {
    fraudPort = makeFraudPort('approved');

    const initiateUseCase = new InitiateCheckoutUseCase(checkoutRepo, basketPort);
    const initiateResult = await initiateUseCase.execute(new InitiateCheckoutCommand('basket-3', 'cust-3'));
    const checkoutId = initiateResult.checkoutId;

    const setAddressUseCase = new SetShippingAddressUseCase(
      checkoutRepo,
      basketPort,
      taxPort,
      promotionPort,
    );
    await setAddressUseCase.execute(new SetShippingAddressCommand(checkoutId, 'Bob', 'Jones', '789 Pine Rd', 'Chicago', '60601', 'US'));

    const setShippingUseCase = new SetShippingMethodUseCase(checkoutRepo, shippingPort);
    await setShippingUseCase.execute(new SetShippingMethodCommand(checkoutId, 'standard'));

    const session = await checkoutRepo.findById(checkoutId);
    session!.setPaymentMethod('pm_card_visa');
    await checkoutRepo.save(session!);

    const createPaymentUseCase = new CreatePaymentIntentUseCase(
      checkoutRepo,
      basketPort,
      orderPort,
      paymentPort,
      fraudPort,
    );

    const paymentResult = await createPaymentUseCase.execute(new CreatePaymentIntentCommand(checkoutId, 'cust-3'));

    expect(fraudPort.screenOrder).toHaveBeenCalled();
    expect(paymentResult.paymentIntent.id).toBe('pi_test_123');
    expect(paymentPort.initiatePayment).toHaveBeenCalled();
  });

  it('should compute correct itemized total matching hand-computed expectations', async () => {
    const initiateUseCase = new InitiateCheckoutUseCase(checkoutRepo, basketPort);
    const result = await initiateUseCase.execute(new InitiateCheckoutCommand('basket-4', 'cust-4'));
    const checkoutId = result.checkoutId;

    const setAddressUseCase = new SetShippingAddressUseCase(
      checkoutRepo,
      basketPort,
      taxPort,
      promotionPort,
    );
    await setAddressUseCase.execute(new SetShippingAddressCommand(checkoutId, 'Alice', 'Brown', '321 Elm St', 'Seattle', '98101', 'US'));

    const applyCouponUseCase = new ApplyCouponUseCase(checkoutRepo, discountPort);
    await applyCouponUseCase.execute(new ApplyCouponCommand(checkoutId, 'SAVE18'));

    const setShippingUseCase = new SetShippingMethodUseCase(checkoutRepo, shippingPort);
    await setShippingUseCase.execute(new SetShippingMethodCommand(checkoutId, 'standard'));

    const session = await checkoutRepo.findById(checkoutId);

    // Assert the full itemized breakdown
    expect(session!.subtotal.amount).toBe(EXPECTED.subtotal); // 120.00
    expect(session!.discountAmount.amount).toBe(EXPECTED.discount); // 18.00
    expect(session!.taxAmount.amount).toBe(EXPECTED.tax); // 10.00
    expect(session!.shippingAmount.amount).toBe(EXPECTED.shipping); // 20.00

    // Total = subtotal - discount + tax + shipping
    const computedTotal =
      session!.subtotal.amount - session!.discountAmount.amount + session!.taxAmount.amount + session!.shippingAmount.amount;
    expect(session!.total.amount).toBe(computedTotal);
    expect(session!.total.amount).toBe(EXPECTED.total); // 132.00
  });
});
