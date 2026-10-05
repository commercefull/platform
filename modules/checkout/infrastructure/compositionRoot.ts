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
import { CouponRedemptionPort } from '../application/ports/CouponRedemptionPort';
import { DiscountQuotePort } from '../application/ports/DiscountQuotePort';
import { TaxQuotePort } from '../application/ports/TaxQuotePort';
import { ShippingQuotePort } from '../application/ports/ShippingQuotePort';
import { PromotionQuotePort } from '../application/ports/PromotionQuotePort';
import { OrderPlacementPort } from '../application/ports/OrderPlacementPort';
import { PaymentAuthorizationPort } from '../application/ports/PaymentAuthorizationPort';
import { FraudScreeningPort } from '../application/ports/FraudScreeningPort';
import { StoreFulfillmentPort } from '../application/ports/StoreFulfillmentPort';
import { StockAvailabilityPort } from '../application/ports/StockAvailabilityPort';
import { InventoryReservationPort } from '../application/ports/InventoryReservationPort';
import { StoreContextPort } from '../application/ports/StoreContextPort';

import { BasketBasketSnapshotAdapter } from './acl/BasketBasketSnapshotAdapter';
import { CouponDiscountQuoteAdapter } from './acl/CouponDiscountQuoteAdapter';
import { CouponRedemptionAdapter } from './acl/CouponRedemptionAdapter';
import { TaxTaxQuoteAdapter } from './acl/TaxTaxQuoteAdapter';
import { ShippingShippingQuoteAdapter } from './acl/ShippingShippingQuoteAdapter';
import { PromotionPromotionQuoteAdapter } from './acl/PromotionPromotionQuoteAdapter';
import { OrderOrderPlacementAdapter } from './acl/OrderOrderPlacementAdapter';
import { PaymentPaymentAuthorizationAdapter } from './acl/PaymentPaymentAuthorizationAdapter';
import { PaymentFraudScreeningAdapter } from './acl/PaymentFraudScreeningAdapter';
import { StoreStoreFulfillmentAdapter } from './acl/StoreStoreFulfillmentAdapter';
import { InventoryStockAvailabilityAdapter } from './acl/InventoryStockAvailabilityAdapter';
import { InventoryReservationAdapter } from './acl/InventoryReservationAdapter';
import { StoreStoreContextAdapter } from './acl/StoreStoreContextAdapter';

import { CouponRepository } from '../../coupon/infrastructure';
import { CouponPromotionGate } from '../../coupon/infrastructure/acl/CouponPromotionGate';
import promotionRepo from '../../promotion/infrastructure/repositories/promotionRepo';
import { RedeemCouponUseCase } from '../../coupon/application/useCases/RedeemCoupon';
import { createOrderUseCase, cancelOrderUseCase } from '../../order/application/useCases/wired';
import { InitiatePaymentUseCase } from '../../payment/application/useCases/InitiatePayment';
import { screenForFraudUseCase } from '../../payment/application/wired';
import { calculateShippingRatesUseCase } from '../../shipping/application/wired';
import { evaluatePromotionsUseCase } from '../../promotion/application/wired';
import { calculateOrderTaxUseCase } from '../../tax/application/wired';
import taxSettingsRepo from '../../tax/infrastructure/repositories/taxSettingsRepo';
import StoreRepo from '../../store/infrastructure/repositories/StoreRepo';
import { getStoreUseCase } from '../../store/application/useCases/wired';
import * as pickupLocationRepo from '../../store/infrastructure/repositories/pickupLocationRepo';
import InventoryRepo from '../../inventory/infrastructure/repositories/inventoryRepo';
import { reserveStockUseCase, releaseReservationUseCase, confirmReservationUseCase } from '../../inventory/application/wired';
import { repriceBasketUseCase } from '../../basket/application/useCases/wired';
import { LoyaltyLoyaltyAdapter } from './acl/LoyaltyLoyaltyAdapter';
import LoyaltyDataRepository from '../../loyalty/infrastructure/repositories/LoyaltyDataRepository';
import { redeemPointsUseCase } from '../../loyalty/application/wired';
import { LoyaltyQuotePort, LoyaltyRedemptionPort } from '../application/ports/LoyaltyPort';

export interface CheckoutPorts {
  basketSnapshot: BasketSnapshotPort;
  couponRedemption: CouponRedemptionPort;
  discountQuote: DiscountQuotePort;
  taxQuote: TaxQuotePort;
  shippingQuote: ShippingQuotePort;
  promotionQuote: PromotionQuotePort;
  orderPlacement: OrderPlacementPort;
  paymentAuthorization: PaymentAuthorizationPort;
  fraudScreening: FraudScreeningPort;
  storeFulfillment: StoreFulfillmentPort;
  stockAvailability: StockAvailabilityPort;
  inventoryReservation: InventoryReservationPort;
  loyaltyQuote: LoyaltyQuotePort;
  loyaltyRedemption: LoyaltyRedemptionPort;
  storeContext: StoreContextPort;
}

let cachedPorts: CheckoutPorts | null = null;

export function getCheckoutPorts(): CheckoutPorts {
  if (cachedPorts) return cachedPorts;

  cachedPorts = {
    basketSnapshot: new BasketBasketSnapshotAdapter(BasketRepo, repriceBasketUseCase),
    couponRedemption: new CouponRedemptionAdapter(new RedeemCouponUseCase(CouponRepository)),
    discountQuote: new CouponDiscountQuoteAdapter(CouponRepository, new CouponPromotionGate(promotionRepo)),
    taxQuote: new TaxTaxQuoteAdapter(calculateOrderTaxUseCase, taxSettingsRepo),
    shippingQuote: new ShippingShippingQuoteAdapter(calculateShippingRatesUseCase),
    promotionQuote: new PromotionPromotionQuoteAdapter(evaluatePromotionsUseCase),
    orderPlacement: new OrderOrderPlacementAdapter(OrderRepo, createOrderUseCase, cancelOrderUseCase),
    paymentAuthorization: new PaymentPaymentAuthorizationAdapter(new InitiatePaymentUseCase(PaymentRepo)),
    fraudScreening: new PaymentFraudScreeningAdapter(screenForFraudUseCase),
    storeFulfillment: new StoreStoreFulfillmentAdapter(StoreRepo, pickupLocationRepo),
    stockAvailability: new InventoryStockAvailabilityAdapter(InventoryRepo),
    inventoryReservation: new InventoryReservationAdapter(reserveStockUseCase, releaseReservationUseCase, confirmReservationUseCase),
    ...(() => {
      const loyalty = new LoyaltyLoyaltyAdapter(LoyaltyDataRepository.points, redeemPointsUseCase);
      return { loyaltyQuote: loyalty, loyaltyRedemption: loyalty };
    })(),
    storeContext: new StoreStoreContextAdapter(getStoreUseCase),
  };

  return cachedPorts;
}
