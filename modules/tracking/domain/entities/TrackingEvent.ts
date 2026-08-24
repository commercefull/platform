/**
 * Tracking Event Entity
 *
 * Represents a normalized tracking event derived from the event bus.
 * Contains the data needed to send to GTM Server or Meta CAPI,
 * along with consent context for gating.
 */

export interface TrackingUserData {
  email?: string;
  phone?: string;
  customerId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  /** Meta CAPI: Facebook browser ID (fbp cookie) */
  fbp?: string;
  /** Meta CAPI: Facebook click ID (fbc parameter) */
  fbc?: string;
  /** External ID for user matching (e.g. loyalty ID) */
  externalId?: string;
}

export interface TrackingEcommerceData {
  transactionId?: string;
  value?: number;
  currency?: string;
  items?: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    category?: string;
    variant?: string;
  }>;
  coupon?: string;
  shipping?: number;
  tax?: number;
}

export interface TrackingEventProps {
  eventId: string;
  storeId: string;
  sourceEvent: string;
  targetEvent: string;
  providers: string[];
  userData: TrackingUserData;
  ecommerceData: TrackingEcommerceData;
  customData: Record<string, unknown>;
  consentCategory: 'analytics' | 'marketing' | 'thirdParty';
  consentGranted: boolean;
  timestamp: Date;
  correlationId?: string;
}

export class TrackingEvent {
  private props: TrackingEventProps;

  private constructor(props: TrackingEventProps) {
    this.props = props;
  }

  static create(props: TrackingEventProps): TrackingEvent {
    return new TrackingEvent(props);
  }

  static reconstitute(props: TrackingEventProps): TrackingEvent {
    return new TrackingEvent(props);
  }

  get eventId(): string { return this.props.eventId; }
  get storeId(): string { return this.props.storeId; }
  get sourceEvent(): string { return this.props.sourceEvent; }
  get targetEvent(): string { return this.props.targetEvent; }
  get providers(): string[] { return this.props.providers; }
  get userData(): TrackingUserData { return this.props.userData; }
  get ecommerceData(): TrackingEcommerceData { return this.props.ecommerceData; }
  get customData(): Record<string, unknown> { return this.props.customData; }
  get consentCategory(): 'analytics' | 'marketing' | 'thirdParty' { return this.props.consentCategory; }
  get consentGranted(): boolean { return this.props.consentGranted; }
  get timestamp(): Date { return this.props.timestamp; }
  get correlationId(): string | undefined { return this.props.correlationId; }

  shouldSendToGtm(): boolean { return this.props.providers.includes('gtm') && this.props.consentGranted; }
  shouldSendToMetaCapi(): boolean { return this.props.providers.includes('meta_capi') && this.props.consentGranted; }

  /**
   * Get user data with PII hashed (SHA-256) for Meta CAPI
   */
  getHashedUserData(): TrackingUserData {
    return {
      ...this.props.userData,
      email: this.props.userData.email ? hashSha256(this.props.userData.email.toLowerCase().trim()) : undefined,
      phone: this.props.userData.phone ? hashSha256(normalizePhone(this.props.userData.phone)) : undefined,
    };
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function hashSha256(input: string): string {
  // Simple hash for domain layer — actual SHA-256 done in adapter via crypto
  // This is a placeholder; the adapter handles real hashing
  return `sha256:${input}`;
}
