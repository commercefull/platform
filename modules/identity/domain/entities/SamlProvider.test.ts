import { SamlProvider } from './SamlProvider';
import { SsoValidationError } from '../errors/SsoErrors';

describe('SamlProvider', () => {
  const validParams = {
    providerId: 'p-1',
    organizationId: 'org-1',
    name: 'Okta SAML',
    entityId: 'https://okta.com/saml',
    ssoUrl: 'https://okta.com/sso',
    certificate: '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----',
    spEntityId: 'https://commercefull.com/sp',
    acsUrl: 'https://commercefull.com/saml/acs',
  };

  describe('create', () => {
    it('should create a valid SAML provider', () => {
      const provider = SamlProvider.create(validParams);
      expect(provider.providerId).toBe('p-1');
      expect(provider.organizationId).toBe('org-1');
      expect(provider.name).toBe('Okta SAML');
      expect(provider.isActive).toBe(true);
      expect(provider.binding).toBe('redirect');
      expect(provider.nameIdFormat).toBe('emailAddress');
      expect(provider.signAuthnRequest).toBe(false);
    });

    it('should throw if organizationId is empty', () => {
      expect(() => SamlProvider.create({ ...validParams, organizationId: '' })).toThrow(SsoValidationError);
    });

    it('should throw if name is empty', () => {
      expect(() => SamlProvider.create({ ...validParams, name: '' })).toThrow(SsoValidationError);
    });

    it('should throw if entityId is empty', () => {
      expect(() => SamlProvider.create({ ...validParams, entityId: '' })).toThrow(SsoValidationError);
    });

    it('should throw if ssoUrl is empty', () => {
      expect(() => SamlProvider.create({ ...validParams, ssoUrl: '' })).toThrow(SsoValidationError);
    });

    it('should throw if certificate is empty', () => {
      expect(() => SamlProvider.create({ ...validParams, certificate: '' })).toThrow(SsoValidationError);
    });

    it('should use custom attribute mapping', () => {
      const provider = SamlProvider.create({
        ...validParams,
        attributeMapping: {
          email: 'EmailAddress',
          firstName: 'GivenName',
          lastName: 'Surname',
          displayName: 'DisplayName',
        },
      });
      expect(provider.attributeMapping.email).toBe('EmailAddress');
      expect(provider.attributeMapping.firstName).toBe('GivenName');
    });

    it('should use default attribute mapping when not specified', () => {
      const provider = SamlProvider.create(validParams);
      expect(provider.attributeMapping.email).toBe('email');
      expect(provider.attributeMapping.firstName).toBe('givenName');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const provider = SamlProvider.reconstitute({
        providerId: 'p-2',
        organizationId: 'org-2',
        name: 'Azure AD',
        entityId: 'https://azure.com/saml',
        ssoUrl: 'https://azure.com/sso',
        sloUrl: 'https://azure.com/slo',
        certificate: 'cert',
        spEntityId: 'https://commercefull.com/sp',
        acsUrl: 'https://commercefull.com/saml/acs',
        binding: 'post',
        nameIdFormat: 'persistent',
        signAuthnRequest: true,
        spPrivateKey: 'key',
        spCertificate: 'sp-cert',
        attributeMapping: { email: 'email', firstName: 'fn', lastName: 'ln', displayName: 'dn' },
        isActive: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });

      expect(provider.isActive).toBe(false);
      expect(provider.binding).toBe('post');
      expect(provider.nameIdFormat).toBe('persistent');
      expect(provider.signAuthnRequest).toBe(true);
      expect(provider.sloUrl).toBe('https://azure.com/slo');
    });
  });

  describe('lifecycle', () => {
    it('should activate and deactivate', () => {
      const provider = SamlProvider.create(validParams);
      expect(provider.isActive).toBe(true);
      provider.deactivate();
      expect(provider.isActive).toBe(false);
      provider.activate();
      expect(provider.isActive).toBe(true);
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata fields', () => {
      const provider = SamlProvider.create(validParams);
      provider.updateMetadata({ name: 'New Name', ssoUrl: 'https://new.com/sso' });
      expect(provider.name).toBe('New Name');
      expect(provider.ssoUrl).toBe('https://new.com/sso');
    });
  });

  describe('updateCertificate', () => {
    it('should update certificate', () => {
      const provider = SamlProvider.create(validParams);
      provider.updateCertificate('new-cert');
      expect(provider.certificate).toBe('new-cert');
    });

    it('should throw if certificate is empty', () => {
      const provider = SamlProvider.create(validParams);
      expect(() => provider.updateCertificate('')).toThrow(SsoValidationError);
    });
  });

  describe('updateAttributeMapping', () => {
    it('should update individual mapping fields', () => {
      const provider = SamlProvider.create(validParams);
      provider.updateAttributeMapping({ email: 'mail' });
      expect(provider.attributeMapping.email).toBe('mail');
      expect(provider.attributeMapping.firstName).toBe('givenName');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON without exposing secrets', () => {
      const provider = SamlProvider.create({
        ...validParams,
        spPrivateKey: 'secret-key',
        spCertificate: 'sp-cert',
      });
      const json = provider.toJSON() as Record<string, unknown>;
      expect(json.providerId).toBe('p-1');
      expect(json.hasSpPrivateKey).toBe(true);
      expect(json.spPrivateKey).toBeUndefined();
    });
  });
});
