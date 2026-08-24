import { GdprCookieConsent } from './GdprCookieConsent';
import { GdprValidationError } from '../errors/GdprErrors';

describe('GdprCookieConsent', () => {
  it('should create anonymous consent (happy path)', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1',
      preferences: { functional: true, analytics: false, marketing: false, thirdParty: false },
    });
    expect(consent.gdprCookieConsentId).toBe('c1');
    expect(consent.necessary).toBe(true);
    expect(consent.functional).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.consentMethod).toBe('banner');
    expect(consent.expiresAt).toBeDefined();
  });

  it('should create customer consent', () => {
    const consent = GdprCookieConsent.createForCustomer({
      gdprCookieConsentId: 'c1', customerId: 'cust1',
      preferences: { analytics: true },
    });
    expect(consent.customerId).toBe('cust1');
    expect(consent.analytics).toBe(true);
    expect(consent.functional).toBe(false);
  });

  it('should get preferences', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1',
      preferences: { functional: true, analytics: true, marketing: false, thirdParty: true },
    });
    const prefs = consent.getPreferences();
    expect(prefs.necessary).toBe(true);
    expect(prefs.functional).toBe(true);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(false);
    expect(prefs.thirdParty).toBe(true);
  });

  it('should check if category is allowed', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1',
      preferences: { analytics: true },
    });
    expect(consent.isAllowed('necessary')).toBe(true);
    expect(consent.isAllowed('analytics')).toBe(true);
    expect(consent.isAllowed('marketing')).toBe(false);
  });

  it('should update preferences', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1', preferences: {},
    });
    consent.updatePreferences({ marketing: true, thirdParty: true });
    expect(consent.marketing).toBe(true);
    expect(consent.thirdParty).toBe(true);
  });

  it('should accept all', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1', preferences: {},
    });
    consent.acceptAll();
    expect(consent.functional).toBe(true);
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(true);
    expect(consent.thirdParty).toBe(true);
  });

  it('should reject all optional', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1',
      preferences: { functional: true, analytics: true, marketing: true, thirdParty: true },
    });
    consent.rejectAll();
    expect(consent.functional).toBe(false);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
    expect(consent.thirdParty).toBe(false);
    expect(consent.necessary).toBe(true);
  });

  it('should link to customer', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1', preferences: {},
    });
    consent.linkToCustomer('cust1');
    expect(consent.customerId).toBe('cust1');
    expect(consent.linkedAt).toBeDefined();
  });

  it('should throw on double link', () => {
    const consent = GdprCookieConsent.createForCustomer({
      gdprCookieConsentId: 'c1', customerId: 'cust1', preferences: {},
    });
    expect(() => consent.linkToCustomer('cust2')).toThrow(GdprValidationError);
  });

  it('should check expiry', () => {
    const consent = GdprCookieConsent.reconstitute({
      gdprCookieConsentId: 'c1', sessionId: 's1', necessary: true, functional: false,
      analytics: false, marketing: false, thirdParty: false, consentMethod: 'banner',
      consentedAt: new Date(), expiresAt: new Date(Date.now() - 86400000),
      createdAt: new Date(), updatedAt: new Date(),
    });
    expect(consent.isExpired()).toBe(true);
  });

  it('should not be expired when no expiresAt', () => {
    const consent = GdprCookieConsent.reconstitute({
      gdprCookieConsentId: 'c1', sessionId: 's1', necessary: true, functional: false,
      analytics: false, marketing: false, thirdParty: false, consentMethod: 'banner',
      consentedAt: new Date(),
      createdAt: new Date(), updatedAt: new Date(),
    });
    expect(consent.isExpired()).toBe(false);
  });

  it('should serialize to JSON', () => {
    const consent = GdprCookieConsent.createAnonymous({
      gdprCookieConsentId: 'c1', sessionId: 's1', preferences: {},
    });
    const json = consent.toJSON();
    expect(json.gdprCookieConsentId).toBe('c1');
    expect(json.isExpired).toBeDefined();
  });
});
