/**
 * Manage Cookie Consent Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { GdprCookieConsentRepository } from '../../domain/repositories/GdprRepository';
import { GdprCookieConsent, CookiePreferences } from '../../domain/entities/GdprCookieConsent';

// ============================================================================
// Commands
// ============================================================================

export class RecordCookieConsentCommand {
  constructor(
    public readonly sessionId: string,
    public readonly preferences: Partial<CookiePreferences>,
    public readonly customerId?: string,
    public readonly browserFingerprint?: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly country?: string,
    public readonly region?: string,
    public readonly consentBannerVersion?: string,
    public readonly consentMethod?: 'banner' | 'settings' | 'api'
  ) {}
}

export class UpdateCookieConsentCommand {
  constructor(
    public readonly cookieConsentId: string,
    public readonly preferences: Partial<CookiePreferences>
  ) {}
}

export class LinkConsentToCustomerCommand {
  constructor(
    public readonly sessionId: string,
    public readonly customerId: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CookieConsentResponse {
  gdprCookieConsentId: string;
  preferences: CookiePreferences;
  consentedAt: string;
  expiresAt?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageCookieConsentUseCase {
  constructor(
    private readonly consentRepository: GdprCookieConsentRepository
  ) {}

  /**
   * Record new cookie consent
   */
  async recordConsent(command: RecordCookieConsentCommand): Promise<CookieConsentResponse> {
    if (!command.sessionId?.trim()) {
      throw new Error('Session ID is required');
    }

    // Check for existing consent
    let consent = await this.consentRepository.findBySessionId(command.sessionId);

    if (consent) {
      // Update existing consent
      consent.updatePreferences(command.preferences);
    } else if (command.customerId) {
      // Create consent for authenticated user
      consent = GdprCookieConsent.createForCustomer({
        gdprCookieConsentId: generateUUID(),
        customerId: command.customerId,
        sessionId: command.sessionId,
        preferences: command.preferences,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        country: command.country,
        consentBannerVersion: command.consentBannerVersion,
        consentMethod: command.consentMethod
      });
    } else {
      // Create consent for anonymous user
      consent = GdprCookieConsent.createAnonymous({
        gdprCookieConsentId: generateUUID(),
        sessionId: command.sessionId,
        browserFingerprint: command.browserFingerprint,
        preferences: command.preferences,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        country: command.country,
        region: command.region,
        consentBannerVersion: command.consentBannerVersion,
        consentMethod: command.consentMethod
      });
    }

    await this.consentRepository.save(consent!);

    return {
      gdprCookieConsentId: consent.gdprCookieConsentId,
      preferences: consent.getPreferences(),
      consentedAt: consent.consentedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString()
    };
  }

  /**
   * Update existing cookie consent
   */
  async updateConsent(command: UpdateCookieConsentCommand): Promise<CookieConsentResponse> {
    const consent = await this.consentRepository.findById(command.cookieConsentId);
    if (!consent) {
      throw new Error('Cookie consent not found');
    }

    consent.updatePreferences(command.preferences);
    await this.consentRepository.save(consent);

    return {
      gdprCookieConsentId: consent.gdprCookieConsentId,
      preferences: consent.getPreferences(),
      consentedAt: consent.consentedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString()
    };
  }

  /**
   * Accept all cookies
   */
  async acceptAll(sessionId: string): Promise<CookieConsentResponse> {
    let consent = await this.consentRepository.findBySessionId(sessionId);
    
    if (!consent) {
      consent = GdprCookieConsent.createAnonymous({
        gdprCookieConsentId: generateUUID(),
        sessionId,
        preferences: {
          necessary: true,
          functional: true,
          analytics: true,
          marketing: true,
          thirdParty: true
        }
      });
    } else {
      consent.acceptAll();
    }

    await this.consentRepository.save(consent);

    return {
      gdprCookieConsentId: consent.gdprCookieConsentId,
      preferences: consent.getPreferences(),
      consentedAt: consent.consentedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString()
    };
  }

  /**
   * Reject all optional cookies
   */
  async rejectAll(sessionId: string): Promise<CookieConsentResponse> {
    let consent = await this.consentRepository.findBySessionId(sessionId);
    
    if (!consent) {
      consent = GdprCookieConsent.createAnonymous({
        gdprCookieConsentId: generateUUID(),
        sessionId,
        preferences: {
          necessary: true,
          functional: false,
          analytics: false,
          marketing: false,
          thirdParty: false
        }
      });
    } else {
      consent.rejectAll();
    }

    await this.consentRepository.save(consent);

    return {
      gdprCookieConsentId: consent.gdprCookieConsentId,
      preferences: consent.getPreferences(),
      consentedAt: consent.consentedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString()
    };
  }

  /**
   * Get current consent for session
   */
  async getConsent(sessionId: string): Promise<CookieConsentResponse | null> {
    const consent = await this.consentRepository.findBySessionId(sessionId);
    if (!consent) return null;

    return {
      gdprCookieConsentId: consent.gdprCookieConsentId,
      preferences: consent.getPreferences(),
      consentedAt: consent.consentedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString()
    };
  }

  /**
   * Link anonymous consent to customer after login
   */
  async linkToCustomer(command: LinkConsentToCustomerCommand): Promise<CookieConsentResponse | null> {
    const consent = await this.consentRepository.findBySessionId(command.sessionId);
    if (!consent) return null;

    // Check if customer already has consent
    const existingCustomerConsent = await this.consentRepository.findByCustomerId(command.customerId);
    if (existingCustomerConsent) {
      // Merge or keep existing - for now, keep existing customer consent
      return {
        gdprCookieConsentId: existingCustomerConsent.gdprCookieConsentId,
        preferences: existingCustomerConsent.getPreferences(),
        consentedAt: existingCustomerConsent.consentedAt.toISOString(),
        expiresAt: existingCustomerConsent.expiresAt?.toISOString()
      };
    }

    // Link the anonymous consent to the customer
    consent.linkToCustomer(command.customerId);
    await this.consentRepository.save(consent);

    return {
      gdprCookieConsentId: consent.gdprCookieConsentId,
      preferences: consent.getPreferences(),
      consentedAt: consent.consentedAt.toISOString(),
      expiresAt: consent.expiresAt?.toISOString()
    };
  }
}
