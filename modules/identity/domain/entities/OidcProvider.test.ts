import { OidcProvider } from './OidcProvider';
import { SsoValidationError } from '../errors/SsoErrors';

describe('OidcProvider', () => {
  const validParams = {
    providerId: 'p-1',
    organizationId: 'org-1',
    name: 'Azure AD OIDC',
    issuerUrl: 'https://login.microsoftonline.com/tenant/v2.0',
    clientId: 'client-123',
    clientSecret: 'secret-456',
    redirectUri: 'https://commercefull.com/oidc/callback',
  };

  describe('create', () => {
    it('should create a valid OIDC provider', () => {
      const provider = OidcProvider.create(validParams);
      expect(provider.providerId).toBe('p-1');
      expect(provider.organizationId).toBe('org-1');
      expect(provider.name).toBe('Azure AD OIDC');
      expect(provider.isActive).toBe(true);
      expect(provider.usePkce).toBe(true);
      expect(provider.useDiscovery).toBe(true);
      expect(provider.scopes).toEqual(['openid', 'email', 'profile']);
    });

    it('should throw if organizationId is empty', () => {
      expect(() => OidcProvider.create({ ...validParams, organizationId: '' })).toThrow(SsoValidationError);
    });

    it('should throw if issuerUrl is empty', () => {
      expect(() => OidcProvider.create({ ...validParams, issuerUrl: '' })).toThrow(SsoValidationError);
    });

    it('should throw if clientId is empty', () => {
      expect(() => OidcProvider.create({ ...validParams, clientId: '' })).toThrow(SsoValidationError);
    });

    it('should throw if clientSecret is empty', () => {
      expect(() => OidcProvider.create({ ...validParams, clientSecret: '' })).toThrow(SsoValidationError);
    });

    it('should throw if redirectUri is empty', () => {
      expect(() => OidcProvider.create({ ...validParams, redirectUri: '' })).toThrow(SsoValidationError);
    });

    it('should throw if discovery disabled without manual endpoints', () => {
      expect(() => OidcProvider.create({ ...validParams, useDiscovery: false })).toThrow(SsoValidationError);
    });

    it('should create with manual endpoints when discovery disabled', () => {
      const provider = OidcProvider.create({
        ...validParams,
        useDiscovery: false,
        authorizationEndpoint: 'https://idp.com/auth',
        tokenEndpoint: 'https://idp.com/token',
        userinfoEndpoint: 'https://idp.com/userinfo',
      });
      expect(provider.useDiscovery).toBe(false);
      expect(provider.authorizationEndpoint).toBe('https://idp.com/auth');
    });

    it('should use custom claim mapping', () => {
      const provider = OidcProvider.create({
        ...validParams,
        claimMapping: {
          email: 'mail',
          firstName: 'given_name',
          lastName: 'family_name',
          displayName: 'name',
        },
      });
      expect(provider.claimMapping.email).toBe('mail');
    });

    it('should use default scopes when not specified', () => {
      const provider = OidcProvider.create(validParams);
      expect(provider.scopes).toEqual(['openid', 'email', 'profile']);
    });

    it('should use custom scopes', () => {
      const provider = OidcProvider.create({
        ...validParams,
        scopes: ['openid', 'email', 'profile', 'groups'],
      });
      expect(provider.scopes).toContain('groups');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const provider = OidcProvider.reconstitute({
        providerId: 'p-2',
        organizationId: 'org-2',
        name: 'Okta OIDC',
        issuerUrl: 'https://okta.com',
        clientId: 'client',
        clientSecret: 'secret',
        scopes: ['openid'],
        redirectUri: 'https://app.com/callback',
        usePkce: false,
        useDiscovery: false,
        authorizationEndpoint: 'https://okta.com/auth',
        tokenEndpoint: 'https://okta.com/token',
        userinfoEndpoint: 'https://okta.com/userinfo',
        jwksUri: 'https://okta.com/jwks',
        claimMapping: { email: 'email', firstName: 'fn', lastName: 'ln', displayName: 'dn' },
        isActive: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });

      expect(provider.isActive).toBe(false);
      expect(provider.usePkce).toBe(false);
      expect(provider.jwksUri).toBe('https://okta.com/jwks');
    });
  });

  describe('lifecycle', () => {
    it('should activate and deactivate', () => {
      const provider = OidcProvider.create(validParams);
      expect(provider.isActive).toBe(true);
      provider.deactivate();
      expect(provider.isActive).toBe(false);
      provider.activate();
      expect(provider.isActive).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update config fields', () => {
      const provider = OidcProvider.create(validParams);
      provider.updateConfig({ name: 'New Name', clientId: 'new-client' });
      expect(provider.name).toBe('New Name');
      expect(provider.clientId).toBe('new-client');
    });
  });

  describe('updateClientSecret', () => {
    it('should update client secret', () => {
      const provider = OidcProvider.create(validParams);
      provider.updateClientSecret('new-secret');
      expect(provider.clientSecret).toBe('new-secret');
    });

    it('should throw if secret is empty', () => {
      const provider = OidcProvider.create(validParams);
      expect(() => provider.updateClientSecret('')).toThrow(SsoValidationError);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON without exposing client secret', () => {
      const provider = OidcProvider.create(validParams);
      const json = provider.toJSON() as Record<string, unknown>;
      expect(json.providerId).toBe('p-1');
      expect(json.hasClientSecret).toBe(true);
      expect(json.clientSecret).toBeUndefined();
    });
  });
});
