/**
 * GDPR Cookie Consent Entity
 * Tracks cookie consent for both authenticated and anonymous users
 */

export interface GdprCookieConsentProps {
  gdprCookieConsentId: string;
  customerId?: string;
  sessionId?: string;
  browserFingerprint?: string;
  // Cookie categories
  necessary: boolean; // Always true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  // Audit info
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  // Consent details
  consentBannerVersion?: string;
  consentMethod: 'banner' | 'settings' | 'api';
  consentedAt: Date;
  expiresAt?: Date;
  linkedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

export class GdprCookieConsent {
  private props: GdprCookieConsentProps;

  private constructor(props: GdprCookieConsentProps) {
    this.props = props;
  }

  /**
   * Create new cookie consent for anonymous user
   */
  static createAnonymous(params: {
    gdprCookieConsentId: string;
    sessionId: string;
    browserFingerprint?: string;
    preferences: Partial<CookiePreferences>;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    region?: string;
    consentBannerVersion?: string;
    consentMethod?: 'banner' | 'settings' | 'api';
  }): GdprCookieConsent {
    const now = new Date();
    // Consent expires in 1 year per GDPR best practices
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return new GdprCookieConsent({
      gdprCookieConsentId: params.gdprCookieConsentId,
      sessionId: params.sessionId,
      browserFingerprint: params.browserFingerprint,
      necessary: true, // Always true
      functional: params.preferences.functional ?? false,
      analytics: params.preferences.analytics ?? false,
      marketing: params.preferences.marketing ?? false,
      thirdParty: params.preferences.thirdParty ?? false,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      country: params.country,
      region: params.region,
      consentBannerVersion: params.consentBannerVersion,
      consentMethod: params.consentMethod || 'banner',
      consentedAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Create cookie consent for authenticated user
   */
  static createForCustomer(params: {
    gdprCookieConsentId: string;
    customerId: string;
    sessionId?: string;
    preferences: Partial<CookiePreferences>;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
    consentBannerVersion?: string;
    consentMethod?: 'banner' | 'settings' | 'api';
  }): GdprCookieConsent {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return new GdprCookieConsent({
      gdprCookieConsentId: params.gdprCookieConsentId,
      customerId: params.customerId,
      sessionId: params.sessionId,
      necessary: true,
      functional: params.preferences.functional ?? false,
      analytics: params.preferences.analytics ?? false,
      marketing: params.preferences.marketing ?? false,
      thirdParty: params.preferences.thirdParty ?? false,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      country: params.country,
      consentBannerVersion: params.consentBannerVersion,
      consentMethod: params.consentMethod || 'banner',
      consentedAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: GdprCookieConsentProps): GdprCookieConsent {
    return new GdprCookieConsent(props);
  }

  // Getters
  get gdprCookieConsentId(): string {
    return this.props.gdprCookieConsentId;
  }
  get customerId(): string | undefined {
    return this.props.customerId;
  }
  get sessionId(): string | undefined {
    return this.props.sessionId;
  }
  get browserFingerprint(): string | undefined {
    return this.props.browserFingerprint;
  }
  get necessary(): boolean {
    return this.props.necessary;
  }
  get functional(): boolean {
    return this.props.functional;
  }
  get analytics(): boolean {
    return this.props.analytics;
  }
  get marketing(): boolean {
    return this.props.marketing;
  }
  get thirdParty(): boolean {
    return this.props.thirdParty;
  }
  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }
  get userAgent(): string | undefined {
    return this.props.userAgent;
  }
  get country(): string | undefined {
    return this.props.country;
  }
  get region(): string | undefined {
    return this.props.region;
  }
  get consentBannerVersion(): string | undefined {
    return this.props.consentBannerVersion;
  }
  get consentMethod(): string {
    return this.props.consentMethod;
  }
  get consentedAt(): Date {
    return this.props.consentedAt;
  }
  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }
  get linkedAt(): Date | undefined {
    return this.props.linkedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Get all preferences as object
   */
  getPreferences(): CookiePreferences {
    return {
      necessary: this.props.necessary,
      functional: this.props.functional,
      analytics: this.props.analytics,
      marketing: this.props.marketing,
      thirdParty: this.props.thirdParty,
    };
  }

  /**
   * Check if consent has expired
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if specific category is allowed
   */
  isAllowed(category: keyof CookiePreferences): boolean {
    return this.props[category];
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences: Partial<CookiePreferences>): void {
    if (preferences.functional !== undefined) {
      this.props.functional = preferences.functional;
    }
    if (preferences.analytics !== undefined) {
      this.props.analytics = preferences.analytics;
    }
    if (preferences.marketing !== undefined) {
      this.props.marketing = preferences.marketing;
    }
    if (preferences.thirdParty !== undefined) {
      this.props.thirdParty = preferences.thirdParty;
    }
    this.props.consentedAt = new Date();
    this.props.updatedAt = new Date();

    // Reset expiry
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    this.props.expiresAt = expiresAt;
  }

  /**
   * Accept all cookies
   */
  acceptAll(): void {
    this.props.functional = true;
    this.props.analytics = true;
    this.props.marketing = true;
    this.props.thirdParty = true;
    this.props.consentedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Reject all optional cookies
   */
  rejectAll(): void {
    this.props.functional = false;
    this.props.analytics = false;
    this.props.marketing = false;
    this.props.thirdParty = false;
    this.props.consentedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Link anonymous consent to customer
   */
  linkToCustomer(customerId: string): void {
    if (this.props.customerId) {
      throw new Error('Consent is already linked to a customer');
    }
    this.props.customerId = customerId;
    this.props.linkedAt = new Date();
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      isExpired: this.isExpired(),
    };
  }
}
