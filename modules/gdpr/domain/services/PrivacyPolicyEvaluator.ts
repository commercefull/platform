/**
 * PrivacyPolicyEvaluator — Jurisdiction Consent Regime Domain Service
 *
 * Resolves the privacy regime that applies to a data subject from their
 * jurisdiction (country + optional subdivision, e.g. US-CA). Pure domain
 * service: no I/O, no infrastructure — country-group membership comes from
 * `libs/geo`, so adding a new jurisdiction is a mapping change, not a
 * fork of consent logic.
 */

import { isGdprRegion } from '../../../../libs/geo/countryGroups';

/** Named privacy regimes the platform recognises. */
export type PrivacyRegime =
  | 'GDPR' // EU/EEA/UK/CH — prior opt-in consent required
  | 'UK_GDPR' // United Kingdom
  | 'CCPA_CPAP' // California (CCPA/CPRA) — opt-out of sale/share
  | 'LGPD' // Brazil
  | 'PIPEDA' // Canada
  | 'APPI' // Japan
  | 'PDPA' // Singapore/Thailand-class
  | 'DEFAULT'; // No specific regime — platform default (notice only)

/** How consent must be captured for non-essential processing. */
type ConsentModel = 'opt_in' | 'opt_out' | 'notice_only';

export interface PrivacyRequirements {
  regime: PrivacyRegime;
  /** Consent model for non-essential cookies/tracking. */
  consentModel: ConsentModel;
  /** A consent banner must be shown before non-essential processing. */
  requiresConsentBanner: boolean;
  /** "Do not sell/share my data" link must be offered. */
  requiresDoNotSell: boolean;
  /** Data subject has the right to erasure under this regime. */
  supportsErasureRequest: boolean;
  /** Data subject has the right to data portability/export. */
  supportsExportRequest: boolean;
  /** Re-confirm consent after this many days (0 = no expiry). */
  consentExpiryDays: number;
  /** Marketing requires separate explicit consent (not bundled). */
  requiresGranularMarketingConsent: boolean;
}

/** Subdivision regimes — `US-CA` → CCPA/CPRA. */
const SUBDIVISION_REGIMES: Record<string, PrivacyRegime> = {
  'US-CA': 'CCPA_CPAP',
};

const COUNTRY_REGIMES: Record<string, PrivacyRegime> = {
  BR: 'LGPD',
  CA: 'PIPEDA',
  JP: 'APPI',
  SG: 'PDPA',
  TH: 'PDPA',
};

const REGIME_REQUIREMENTS: Record<PrivacyRegime, Omit<PrivacyRequirements, 'regime'>> = {
  GDPR: {
    consentModel: 'opt_in',
    requiresConsentBanner: true,
    requiresDoNotSell: false,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 365,
    requiresGranularMarketingConsent: true,
  },
  UK_GDPR: {
    consentModel: 'opt_in',
    requiresConsentBanner: true,
    requiresDoNotSell: false,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 365,
    requiresGranularMarketingConsent: true,
  },
  CCPA_CPAP: {
    consentModel: 'opt_out',
    requiresConsentBanner: false,
    requiresDoNotSell: true,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 365,
    requiresGranularMarketingConsent: false,
  },
  LGPD: {
    consentModel: 'opt_in',
    requiresConsentBanner: true,
    requiresDoNotSell: false,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 365,
    requiresGranularMarketingConsent: true,
  },
  PIPEDA: {
    consentModel: 'opt_out',
    requiresConsentBanner: false,
    requiresDoNotSell: false,
    supportsErasureRequest: true,
    supportsExportRequest: false,
    consentExpiryDays: 0,
    requiresGranularMarketingConsent: true,
  },
  APPI: {
    consentModel: 'opt_out',
    requiresConsentBanner: false,
    requiresDoNotSell: true,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 0,
    requiresGranularMarketingConsent: false,
  },
  PDPA: {
    consentModel: 'opt_in',
    requiresConsentBanner: true,
    requiresDoNotSell: false,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 365,
    requiresGranularMarketingConsent: true,
  },
  DEFAULT: {
    consentModel: 'notice_only',
    requiresConsentBanner: false,
    requiresDoNotSell: false,
    supportsErasureRequest: true,
    supportsExportRequest: true,
    consentExpiryDays: 0,
    requiresGranularMarketingConsent: false,
  },
};

export class PrivacyPolicyEvaluator {
  /**
   * Resolve the regime for a jurisdiction. Subdivision wins (US-CA → CCPA)
   * over country (US → DEFAULT) over GDPR-region membership.
   *
   * @param countryCode ISO 3166-1 alpha-2 (e.g. 'DE', 'US', 'BR').
   * @param subdivision Optional region/state code (e.g. 'CA' for California).
   */
  resolveRegime(countryCode: string, subdivision?: string): PrivacyRegime {
    const country = (countryCode ?? '').trim().toUpperCase();
    const sub = (subdivision ?? '').trim().toUpperCase();
    const subdivisionKey = sub ? `${country}-${sub}` : '';
    if (subdivisionKey && SUBDIVISION_REGIMES[subdivisionKey]) return SUBDIVISION_REGIMES[subdivisionKey];
    if (country === 'GB') return 'UK_GDPR';
    if (COUNTRY_REGIMES[country]) return COUNTRY_REGIMES[country];
    if (isGdprRegion(country)) return 'GDPR';
    return 'DEFAULT';
  }

  /** Full requirements for a jurisdiction — drives banner UI + consent capture. */
  requirementsFor(countryCode: string, subdivision?: string): PrivacyRequirements {
    const regime = this.resolveRegime(countryCode, subdivision);
    return { regime, ...REGIME_REQUIREMENTS[regime] };
  }

  /** Whether non-essential cookies require prior opt-in consent. */
  requiresPriorConsent(countryCode: string, subdivision?: string): boolean {
    return this.requirementsFor(countryCode, subdivision).consentModel === 'opt_in';
  }
}
