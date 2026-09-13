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

import { BasketRepository as BasketRepo } from '../../basket/infrastructure';
import { OrderDataRepository as OrderDataRepo } from '../../order/infrastructure';

const OrderRepo = OrderDataRepo.commands;
import { PaymentDataRepository as PaymentDataRepo } from '../../payment/infrastructure';

const PaymentRepo = PaymentDataRepo.payments;

import { BasketSnapshotPort } from '../application/ports/BasketSnapshotPort';
import { DiscountQuotePort } from '../application/ports/DiscountQuotePort';
import { TaxQuotePort } from '../application/ports/TaxQuotePort';
import { ShippingQuotePort } from '../application/ports/ShippingQuotePort';
import { PromotionQuotePort } from '../application/ports/PromotionQuotePort';
import { OrderPlacementPort } from '../application/ports/OrderPlacementPort';
import { PaymentAuthorizationPort } from '../application/ports/PaymentAuthorizationPort';
import { StoreFulfillmentPort } from '../application/ports/StoreFulfillmentPort';
import { StockAvailabilityPort } from '../application/ports/StockAvailabilityPort';

import { BasketBasketSnapshotAdapter } from './acl/BasketBasketSnapshotAdapter';
import { CouponDiscountQuoteAdapter } from './acl/CouponDiscountQuoteAdapter';
import { TaxTaxQuoteAdapter } from './acl/TaxTaxQuoteAdapter';
import { ShippingShippingQuoteAdapter } from './acl/ShippingShippingQuoteAdapter';
import { PromotionPromotionQuoteAdapter } from './acl/PromotionPromotionQuoteAdapter';
import { OrderOrderPlacementAdapter } from './acl/OrderOrderPlacementAdapter';
import { PaymentPaymentAuthorizationAdapter } from './acl/PaymentPaymentAuthorizationAdapter';
import { StoreStoreFulfillmentAdapter } from './acl/StoreStoreFulfillmentAdapter';
import { InventoryStockAvailabilityAdapter } from './acl/InventoryStockAvailabilityAdapter';

import { CouponRepository } from '../../coupon/infrastructure';
import { calculateShippingRatesUseCase } from '../../shipping/application/useCases/CalculateShippingRates';

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
