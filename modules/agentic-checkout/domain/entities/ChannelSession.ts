/**
 * ChannelSession
 *
 * Links an agentic-surface checkout session (e.g. an ACP `checkout_session`)
 * to the internal checkout/basket it wraps. The internal `checkoutSession`
 * remains authoritative for totals; this entity records channel identity,
 * buyer/attribution data, and lifecycle state.
 */

import { generateUUID } from '../../../../libs/uuid';

export type ChannelSessionStatus = 'active' | 'completing' | 'completed' | 'canceled' | 'expired';

export interface ChannelBuyer {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface ChannelFulfillmentDetails {
  email?: string;
  phone?: string;
  address?: {
    lineOne?: string;
    lineTwo?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface ChannelAttribution {
  /** Surface identifier, e.g. 'chatgpt', 'meta', 'google' */
  surface?: string;
  /** ACP affiliate_attribution — first-touch data */
  firstTouch?: Record<string, unknown>;
  /** ACP affiliate_attribution — last-touch data */
  lastTouch?: Record<string, unknown>;
}

export interface ChannelSessionProps {
  channelSessionId: string;
  integrationId: string;
  organizationId: string;
  storeId: string;
  basketId: string | null;
  checkoutId: string | null;
  orderId: string | null;
  status: ChannelSessionStatus;
  buyer: ChannelBuyer | null;
  fulfillmentDetails: ChannelFulfillmentDetails | null;
  attribution: ChannelAttribution | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export class ChannelSession {
  private constructor(private props: ChannelSessionProps) {}

  static create(params: {
    integrationId: string;
    organizationId: string;
    storeId: string;
    basketId?: string;
    checkoutId?: string;
    buyer?: ChannelBuyer;
    fulfillmentDetails?: ChannelFulfillmentDetails;
    attribution?: ChannelAttribution;
    ttlMinutes?: number;
  }): ChannelSession {
    const now = new Date();
    const ttl = params.ttlMinutes ?? 24 * 60;
    return new ChannelSession({
      channelSessionId: generateUUID(),
      integrationId: params.integrationId,
      organizationId: params.organizationId,
      storeId: params.storeId,
      basketId: params.basketId ?? null,
      checkoutId: params.checkoutId ?? null,
      orderId: null,
      status: 'active',
      buyer: params.buyer ?? null,
      fulfillmentDetails: params.fulfillmentDetails ?? null,
      attribution: params.attribution ?? null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + ttl * 60_000),
    });
  }

  static reconstitute(props: ChannelSessionProps): ChannelSession {
    return new ChannelSession(props);
  }

  get channelSessionId(): string {
    return this.props.channelSessionId;
  }
  get integrationId(): string {
    return this.props.integrationId;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get storeId(): string {
    return this.props.storeId;
  }
  get basketId(): string | null {
    return this.props.basketId;
  }
  get checkoutId(): string | null {
    return this.props.checkoutId;
  }
  get orderId(): string | null {
    return this.props.orderId;
  }
  get status(): ChannelSessionStatus {
    return this.props.status;
  }
  get buyer(): ChannelBuyer | null {
    return this.props.buyer;
  }
  get fulfillmentDetails(): ChannelFulfillmentDetails | null {
    return this.props.fulfillmentDetails;
  }
  get attribution(): ChannelAttribution | null {
    return this.props.attribution;
  }
  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get effectiveStatus(): ChannelSessionStatus {
    if (this.props.status === 'active' || this.props.status === 'completing') {
      return this.isExpired ? 'expired' : this.props.status;
    }
    return this.props.status;
  }

  get isMutable(): boolean {
    return this.effectiveStatus === 'active';
  }

  attachCheckout(basketId: string, checkoutId: string): void {
    this.props.basketId = basketId;
    this.props.checkoutId = checkoutId;
    this.touch();
  }

  setBuyer(buyer: ChannelBuyer): void {
    this.props.buyer = { ...(this.props.buyer ?? {}), ...buyer };
    this.touch();
  }

  setFulfillmentDetails(details: ChannelFulfillmentDetails): void {
    this.props.fulfillmentDetails = { ...(this.props.fulfillmentDetails ?? {}), ...details };
    this.touch();
  }

  setAttribution(attribution: ChannelAttribution): void {
    this.props.attribution = { ...(this.props.attribution ?? {}), ...attribution };
    this.touch();
  }

  markCompleting(): void {
    this.props.status = 'completing';
    this.touch();
  }

  /** Rolls a 'completing' session back to active after a failed completion attempt. */
  revertToActive(): void {
    if (this.props.status === 'completing') {
      this.props.status = 'active';
      this.touch();
    }
  }

  markCompleted(orderId: string, orderNumber?: string): void {
    this.props.status = 'completed';
    this.props.orderId = orderId;
    if (orderNumber) {
      this.props.metadata = { ...(this.props.metadata ?? {}), orderNumber };
    }
    this.touch();
  }

  markCanceled(): void {
    this.props.status = 'canceled';
    this.touch();
  }

  updateMetadata(patch: Record<string, unknown>): void {
    this.props.metadata = { ...(this.props.metadata ?? {}), ...patch };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
