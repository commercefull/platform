/**
 * Composition Root — Checkout Module
 *
 * Wires adapter implementations to port interfaces.
 * Use cases and controllers receive ports via constructor injection;
 * they never construct adapters or import provider modules directly.
 *
 * This is the ONLY place that knows about concrete adapter classes
 * and provider repositories.
 */

import { CheckoutRepository as CheckoutRepo } from '../modules/checkout/infrastructure';
import { BasketRepository as BasketRepo } from '../modules/basket/infrastructure';
import { OrderDataRepository as OrderDataRepo } from '../modules/order/infrastructure';

const OrderRepo = OrderDataRepo.commands;
import { PaymentDataRepository as PaymentDataRepo } from '../modules/payment/infrastructure';

const PaymentRepo = PaymentDataRepo.payments;

import { BasketSnapshotPort } from '../modules/checkout/application/ports/BasketSnapshotPort';
import { DiscountQuotePort } from '../modules/checkout/application/ports/DiscountQuotePort';
import { TaxQuotePort } from '../modules/checkout/application/ports/TaxQuotePort';
import { ShippingQuotePort } from '../modules/checkout/application/ports/ShippingQuotePort';
import { PromotionQuotePort } from '../modules/checkout/application/ports/PromotionQuotePort';
import { OrderPlacementPort } from '../modules/checkout/application/ports/OrderPlacementPort';
import { PaymentAuthorizationPort } from '../modules/checkout/application/ports/PaymentAuthorizationPort';
import { StoreFulfillmentPort } from '../modules/checkout/application/ports/StoreFulfillmentPort';
import { StockAvailabilityPort } from '../modules/checkout/application/ports/StockAvailabilityPort';

import { BasketBasketSnapshotAdapter } from '../modules/checkout/infrastructure/acl/BasketBasketSnapshotAdapter';
import { CouponDiscountQuoteAdapter } from '../modules/checkout/infrastructure/acl/CouponDiscountQuoteAdapter';
import { TaxTaxQuoteAdapter } from '../modules/checkout/infrastructure/acl/TaxTaxQuoteAdapter';
import { ShippingShippingQuoteAdapter } from '../modules/checkout/infrastructure/acl/ShippingShippingQuoteAdapter';
import { PromotionPromotionQuoteAdapter } from '../modules/checkout/infrastructure/acl/PromotionPromotionQuoteAdapter';
import { OrderOrderPlacementAdapter } from '../modules/checkout/infrastructure/acl/OrderOrderPlacementAdapter';
import { PaymentPaymentAuthorizationAdapter } from '../modules/checkout/infrastructure/acl/PaymentPaymentAuthorizationAdapter';
import { StoreStoreFulfillmentAdapter } from '../modules/checkout/infrastructure/acl/StoreStoreFulfillmentAdapter';
import { InventoryStockAvailabilityAdapter } from '../modules/checkout/infrastructure/acl/InventoryStockAvailabilityAdapter';

import { CouponRepository } from '../modules/coupon/infrastructure';
import { calculateShippingRatesUseCase } from '../modules/shipping/application/useCases/CalculateShippingRates';

export interface CheckoutPorts {
  basketSnapshot: BasketSnapshotPort;
  discountQuote: DiscountQuotePort;
  taxQuote: TaxQuotePort;
  shippingQuote: ShippingQuotePort;
  promotionQuote: PromotionQuotePort;
  orderPlacement: OrderPlacementPort;
  paymentAuthorization: PaymentAuthorizationPort;
  storeFulfillment: StoreFulfillmentPort;
  stockAvailability: StockAvailabilityPort;
}

let cachedPorts: CheckoutPorts | null = null;

export function getCheckoutPorts(): CheckoutPorts {
  if (cachedPorts) return cachedPorts;

  cachedPorts = {
    basketSnapshot: new BasketBasketSnapshotAdapter(BasketRepo),
    discountQuote: new CouponDiscountQuoteAdapter(CouponRepository),
    taxQuote: new TaxTaxQuoteAdapter(),
    shippingQuote: new ShippingShippingQuoteAdapter(calculateShippingRatesUseCase),
    promotionQuote: new PromotionPromotionQuoteAdapter(),
    orderPlacement: new OrderOrderPlacementAdapter(OrderRepo),
    paymentAuthorization: new PaymentPaymentAuthorizationAdapter(PaymentRepo),
    storeFulfillment: new StoreStoreFulfillmentAdapter(),
    stockAvailability: new InventoryStockAvailabilityAdapter(),
  };

  return cachedPorts;
}

export { CheckoutRepo };
