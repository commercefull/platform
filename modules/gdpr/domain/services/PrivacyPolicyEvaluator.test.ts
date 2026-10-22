import { PrivacyPolicyEvaluator } from './PrivacyPolicyEvaluator';

describe('PrivacyPolicyEvaluator', () => {
  const evaluator = new PrivacyPolicyEvaluator();

  describe('resolveRegime', () => {
    it('should resolve EU member states to GDPR', () => {
      expect(evaluator.resolveRegime('DE')).toBe('GDPR');
      expect(evaluator.resolveRegime('fr')).toBe('GDPR');
      expect(evaluator.resolveRegime('NO')).toBe('GDPR');
    });

    it('should resolve the UK to UK_GDPR', () => {
      expect(evaluator.resolveRegime('GB')).toBe('UK_GDPR');
    });

    it('should resolve California to CCPA_CPAP via subdivision', () => {
      expect(evaluator.resolveRegime('US', 'CA')).toBe('CCPA_CPAP');
      expect(evaluator.resolveRegime('US', 'ca')).toBe('CCPA_CPAP');
    });

    it('should resolve other US states to DEFAULT', () => {
      expect(evaluator.resolveRegime('US', 'NY')).toBe('DEFAULT');
      expect(evaluator.resolveRegime('US')).toBe('DEFAULT');
    });

    it('should resolve country-level regimes', () => {
      expect(evaluator.resolveRegime('BR')).toBe('LGPD');
      expect(evaluator.resolveRegime('CA')).toBe('PIPEDA');
      expect(evaluator.resolveRegime('JP')).toBe('APPI');
      expect(evaluator.resolveRegime('SG')).toBe('PDPA');
    });
  });

  describe('requirementsFor', () => {
    it('should require opt-in banner and granular marketing consent under GDPR', () => {
      const req = evaluator.requirementsFor('DE');
      expect(req.consentModel).toBe('opt_in');
      expect(req.requiresConsentBanner).toBe(true);
      expect(req.requiresDoNotSell).toBe(false);
      expect(req.supportsErasureRequest).toBe(true);
      expect(req.supportsExportRequest).toBe(true);
      expect(req.requiresGranularMarketingConsent).toBe(true);
    });

    it('should require a do-not-sell link under CCPA without a consent banner', () => {
      const req = evaluator.requirementsFor('US', 'CA');
      expect(req.consentModel).toBe('opt_out');
      expect(req.requiresConsentBanner).toBe(false);
      expect(req.requiresDoNotSell).toBe(true);
    });

    it('should fall back to notice-only for unregulated jurisdictions', () => {
      const req = evaluator.requirementsFor('XX');
      expect(req.regime).toBe('DEFAULT');
      expect(req.consentModel).toBe('notice_only');
      expect(req.requiresConsentBanner).toBe(false);
    });
  });

  describe('requiresPriorConsent', () => {
    it('should require prior consent for opt-in regimes only', () => {
      expect(evaluator.requiresPriorConsent('DE')).toBe(true);
      expect(evaluator.requiresPriorConsent('BR')).toBe(true);
      expect(evaluator.requiresPriorConsent('US', 'CA')).toBe(false);
      expect(evaluator.requiresPriorConsent('US')).toBe(false);
    });
  });
});
