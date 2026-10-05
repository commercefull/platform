/**
 * CheckoutSessionTranslator
 *
 * Maps Commercefull checkout state → ACP `checkout_session` response schema
 * (ACP 2026-04-17). The checkout module remains authoritative — this is a
 * pure projection, no business rules.
 */

import type { ChannelSession } from '../../domain/entities/ChannelSession';
import type { ChannelBasketItem, ChannelCheckoutSnapshot, ChannelShippingOption } from '../ports/ChannelCheckoutPort';

export const ACP_PROTOCOL_VERSION = '2026-04-17';

export const ACP_CAPABILITIES = {
  api_version: ACP_PROTOCOL_VERSION,
  payment_handlers: [{ id: 'stripe', version: 'spt.v1', credential_types: ['spt'] }],
  extensions: [] as string[],
};

export type AcpSessionStatus =
  'not_ready_for_payment' | 'ready_for_payment' | 'complete_in_progress' | 'completed' | 'canceled' | 'expired';

export interface AcpCheckoutSession {
  id: string;
  status: AcpSessionStatus;
  currency: string;
  line_items: AcpLineItem[];
  buyer?: Record<string, unknown>;
  fulfillment_details?: Record<string, unknown>;
  fulfillment_options?: AcpFulfillmentOption[];
  totals: AcpTotal[];
  order?: { id: string; number: string };
  messages?: Array<{ type: 'info' | 'warning' | 'error'; text: string }>;
  capabilities: typeof ACP_CAPABILITIES;
  links?: Array<{ type: string; url: string }>;
}

interface AcpLineItem {
  id: string;
  item: { id: string; quantity: number };
  name: string;
  base_amount: number;
  total: number;
}

interface AcpFulfillmentOption {
  id: string;
  label: string;
  totals: Array<{ type: string; amount: number }>;
  selected?: boolean;
}

interface AcpTotal {
  type: 'items_base_amount' | 'subtotal' | 'discount' | 'fulfillment' | 'tax' | 'total';
  display_text: string;
  amount: number;
}

export function mapChannelStatus(session: ChannelSession, checkout?: ChannelCheckoutSnapshot | null): AcpSessionStatus {
  const status = session.effectiveStatus;
  switch (status) {
    case 'completed':
      return 'completed';
    case 'canceled':
      return 'canceled';
    case 'expired':
      return 'expired';
    case 'completing':
      return 'complete_in_progress';
    case 'active':
      if (checkout?.paymentStatus === 'pending_payment' || checkout?.paymentStatus === 'processing') {
        return 'complete_in_progress';
      }
      return checkout?.isReadyForPayment ? 'ready_for_payment' : 'not_ready_for_payment';
  }
}

export function toAcpSession(params: {
  session: ChannelSession;
  checkout: ChannelCheckoutSnapshot | null;
  basketItems: ChannelBasketItem[];
  shippingOptions?: ChannelShippingOption[];
  orderNumber?: string;
}): AcpCheckoutSession {
  const { session, checkout, basketItems, shippingOptions = [], orderNumber } = params;

  const totals: AcpTotal[] = [];
  if (checkout) {
    if (checkout.discountAmountCents > 0) {
      totals.push({ type: 'discount', display_text: 'Discount', amount: -checkout.discountAmountCents });
    }
    totals.push({ type: 'subtotal', display_text: 'Subtotal', amount: checkout.subtotalCents });
    totals.push({ type: 'fulfillment', display_text: 'Fulfillment', amount: checkout.shippingAmountCents });
    totals.push({ type: 'tax', display_text: 'Tax', amount: checkout.taxAmountCents });
    totals.push({ type: 'total', display_text: 'Total', amount: checkout.totalCents });
  } else {
    const subtotal = basketItems.reduce((sum, i) => sum + i.lineTotalCents, 0);
    totals.push({ type: 'subtotal', display_text: 'Subtotal', amount: subtotal });
    totals.push({ type: 'total', display_text: 'Total', amount: subtotal });
  }

  const selectedMethod = checkout?.shippingMethodId;
  const fulfillmentOptions: AcpFulfillmentOption[] = shippingOptions.map(o => ({
    id: o.methodId,
    label: o.methodName,
    totals: [{ type: 'fulfillment', amount: o.amountCents }],
    selected: o.methodId === selectedMethod,
  }));

  const response: AcpCheckoutSession = {
    id: session.channelSessionId,
    status: mapChannelStatus(session, checkout),
    currency: (checkout?.currency ?? 'usd').toLowerCase(),
    line_items: basketItems.map(item => ({
      id: item.basketItemId,
      item: { id: item.productVariantId ?? item.productId, quantity: item.quantity },
      name: item.name,
      base_amount: item.unitPriceCents,
      total: item.lineTotalCents,
    })),
    totals,
    capabilities: ACP_CAPABILITIES,
  };

  if (session.buyer) {
    response.buyer = {
      first_name: session.buyer.firstName,
      last_name: session.buyer.lastName,
      email: session.buyer.email,
      phone: session.buyer.phone,
    };
  }

  const fd = session.fulfillmentDetails;
  const sa = checkout?.shippingAddress;
  if (fd || sa) {
    response.fulfillment_details = {
      email: fd?.email ?? checkout?.guestEmail,
      phone: fd?.phone,
      address: sa
        ? {
            line_one: sa.addressLine1,
            city: sa.city,
            country: sa.country,
            postal_code: sa.postalCode,
          }
        : fd?.address
          ? {
              line_one: fd.address.lineOne,
              line_two: fd.address.lineTwo,
              city: fd.address.city,
              region: fd.address.region,
              country: fd.address.country,
              postal_code: fd.address.postalCode,
            }
          : undefined,
    };
  }

  if (fulfillmentOptions.length > 0) {
    response.fulfillment_options = fulfillmentOptions;
  }

  if (session.orderId) {
    response.order = { id: session.orderId, number: orderNumber ?? (session.metadata?.orderNumber as string) ?? '' };
  }

  return response;
}
