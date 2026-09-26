/**
 * Composition root for checkout use cases.
 * Instantiates use cases with the shared CheckoutRepository and
 * the cross-module ports from getCheckoutPorts().
 */

import CheckoutRepo from '../../infrastructure/repositories/CheckoutRepository';
import { getCheckoutPorts } from '../../infrastructure/compositionRoot';
import { InitiateCheckoutUseCase } from './InitiateCheckout';
import { SetShippingAddressUseCase } from './SetShippingAddress';
import { SetFulfillmentMethodUseCase } from './SetFulfillmentMethod';
import { SetShippingMethodUseCase } from './SetShippingMethod';
import { SetPaymentMethodUseCase } from './SetPaymentMethod';
import { ApplyCouponUseCase } from './ApplyCoupon';
import { RemoveCouponUseCase } from './RemoveCoupon';
import { CompleteCheckoutUseCase } from './CompleteCheckout';
import { AbandonCheckoutUseCase } from './AbandonCheckout';
import { SetBillingAddressUseCase } from './SetBillingAddress';
import { CreatePaymentIntentUseCase } from './CreatePaymentIntent';
import { GetPickupSlotsUseCase } from './GetPickupSlots';
import { ManageCheckoutSessionUseCase } from './ManageCheckoutSession';
import { SetPickupLocationUseCase } from './SetPickupLocation';

const ports = getCheckoutPorts();

export const manageCheckoutSessionUseCase = new ManageCheckoutSessionUseCase(CheckoutRepo);
export const initiateCheckoutUseCase = new InitiateCheckoutUseCase(CheckoutRepo, ports.basketSnapshot);
export const setShippingAddressUseCase = new SetShippingAddressUseCase(
  CheckoutRepo,
  ports.basketSnapshot,
  ports.taxQuote,
  ports.promotionQuote,
);
export const setFulfillmentMethodUseCase = new SetFulfillmentMethodUseCase(CheckoutRepo);
export const setShippingMethodUseCase = new SetShippingMethodUseCase(CheckoutRepo, ports.shippingQuote);
export const setPaymentMethodUseCase = new SetPaymentMethodUseCase(CheckoutRepo);
export const applyCouponUseCase = new ApplyCouponUseCase(CheckoutRepo, ports.discountQuote);
export const removeCouponUseCase = new RemoveCouponUseCase(CheckoutRepo);
export const completeCheckoutUseCase = new CompleteCheckoutUseCase(CheckoutRepo, ports.orderPlacement);
export const abandonCheckoutUseCase = new AbandonCheckoutUseCase(CheckoutRepo, ports.orderPlacement);
export const setBillingAddressUseCase = new SetBillingAddressUseCase(CheckoutRepo);
export const createPaymentIntentUseCase = new CreatePaymentIntentUseCase(
  CheckoutRepo,
  ports.basketSnapshot,
  ports.orderPlacement,
  ports.paymentAuthorization,
  ports.fraudScreening,
);
export const setPickupLocationUseCase = new SetPickupLocationUseCase(
  CheckoutRepo,
  ports.storeFulfillment,
  ports.basketSnapshot,
  ports.stockAvailability,
);
export const getPickupSlotsUseCase = new GetPickupSlotsUseCase();
