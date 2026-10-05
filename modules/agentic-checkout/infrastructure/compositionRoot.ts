/**
 * Composition Root — Agentic Checkout Module
 *
 * Wires ACL adapter implementations to application ports.
 * This is the ONLY place that knows about provider modules'
 * concrete use cases and repositories.
 */

import { integrationRepo, credentialRepo } from '../../integration/application/useCases/wired';
import { resolveStoreCatalogUseCase } from '../../assortment/application/useCases/wired';
import productRepo from '../../product/infrastructure/repositories/ProductRepository';
import {
  getOrCreateBasketUseCase,
  addItemUseCase,
  updateItemQuantityUseCase,
  removeItemUseCase,
  basketRepo,
} from '../../basket/application/useCases/wired';
import {
  initiateCheckoutUseCase,
  manageCheckoutSessionUseCase,
  setShippingAddressUseCase,
  setFulfillmentMethodUseCase,
  setShippingMethodUseCase,
  applyCouponUseCase,
  createPaymentIntentUseCase,
  completeCheckoutUseCase,
  abandonCheckoutUseCase,
} from '../../checkout/application/useCases/wired';
import { getCheckoutPorts } from '../../checkout/infrastructure/compositionRoot';
import { chargeDelegatedPaymentUseCase } from '../../payment/application/useCases/wired';

import type { ChannelResolverPort } from '../application/ports/ChannelResolverPort';
import type { ChannelCatalogPort } from '../application/ports/ChannelCatalogPort';
import type { ChannelCheckoutPort } from '../application/ports/ChannelCheckoutPort';
import type { DelegatedPaymentPort } from '../application/ports/DelegatedPaymentPort';
import { IntegrationChannelResolverAdapter } from './acl/IntegrationChannelResolverAdapter';
import { AssortmentChannelCatalogAdapter } from './acl/AssortmentChannelCatalogAdapter';
import { CheckoutChannelAdapter } from './acl/CheckoutChannelAdapter';
import { PaymentDelegatedPaymentAdapter } from './acl/PaymentDelegatedPaymentAdapter';

export interface AgenticCheckoutPorts {
  channelResolver: ChannelResolverPort;
  channelCatalog: ChannelCatalogPort;
  channelCheckout: ChannelCheckoutPort;
  delegatedPayment: DelegatedPaymentPort;
}

let ports: AgenticCheckoutPorts | null = null;

export function getAgenticCheckoutPorts(): AgenticCheckoutPorts {
  if (!ports) {
    ports = {
      channelResolver: new IntegrationChannelResolverAdapter(integrationRepo, credentialRepo),
      channelCatalog: new AssortmentChannelCatalogAdapter(resolveStoreCatalogUseCase, productRepo),
      channelCheckout: new CheckoutChannelAdapter(
        getOrCreateBasketUseCase,
        addItemUseCase,
        updateItemQuantityUseCase,
        removeItemUseCase,
        basketRepo,
        initiateCheckoutUseCase,
        manageCheckoutSessionUseCase,
        setShippingAddressUseCase,
        setFulfillmentMethodUseCase,
        setShippingMethodUseCase,
        applyCouponUseCase,
        createPaymentIntentUseCase,
        completeCheckoutUseCase,
        abandonCheckoutUseCase,
        getCheckoutPorts().shippingQuote,
      ),
      delegatedPayment: new PaymentDelegatedPaymentAdapter(chargeDelegatedPaymentUseCase),
    };
  }
  return ports;
}
