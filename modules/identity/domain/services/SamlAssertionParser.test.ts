import { SamlAssertionParser } from './SamlAssertionParser';
import { SamlProvider } from '../entities/SamlProvider';
import { SamlAssertionError } from '../errors/SsoErrors';

describe('SamlAssertionParser', () => {
  const parser = new SamlAssertionParser();

  const provider = SamlProvider.create({
    providerId: 'p-1',
    organizationId: 'org-1',
    name: 'Test IdP',
    entityId: 'https://idp.example.com',
    ssoUrl: 'https://idp.example.com/sso',
    certificate: '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----',
    spEntityId: 'https://sp.example.com',
    acsUrl: 'https://sp.example.com/acs',
  });

  // A minimal SAML response with attributes
  const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
  <saml:Assertion>
    <saml:Issuer>https://idp.example.com</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">user@example.com</saml:NameID>
    </saml:Subject>
    <saml:Conditions NotBefore="2020-01-01T00:00:00Z" NotOnOrAfter="2099-12-31T23:59:59Z"/>
    <saml:AuthnStatement SessionIndex="session-123">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="email">
        <saml:AttributeValue>user@example.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="givenName">
        <saml:AttributeValue>John</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="surname">
        <saml:AttributeValue>Doe</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="displayName">
        <saml:AttributeValue>John Doe</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;

  const samlBase64 = Buffer.from(samlXml).toString('base64');

  describe('parse', () => {
    it('should parse a valid SAML response', () => {
      const result = parser.parse(samlBase64, provider);
      expect(result.nameId).toBe('user@example.com');
      expect(result.nameIdFormat).toBe('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
      expect(result.issuer).toBe('https://idp.example.com');
      expect(result.attributes.email).toBe('user@example.com');
      expect(result.attributes.givenName).toBe('John');
      expect(result.attributes.surname).toBe('Doe');
      expect(result.attributes.displayName).toBe('John Doe');
      expect(result.sessionIndex).toBe('session-123');
    });

    it('should throw on invalid base64', () => {
      expect(() => parser.parse('not-valid-base64!!!', provider)).toThrow(SamlAssertionError);
    });

    it('should throw when no assertion found', () => {
      const noAssertion = Buffer.from('<xml>no assertion here</xml>').toString('base64');
      expect(() => parser.parse(noAssertion, provider)).toThrow(SamlAssertionError);
    });
  });

  describe('mapToUserInfo', () => {
    it('should map assertion attributes to user info', () => {
      const assertion = parser.parse(samlBase64, provider);
      const userInfo = parser.mapToUserInfo(assertion, provider.attributeMapping);
      expect(userInfo.email).toBe('user@example.com');
      expect(userInfo.firstName).toBe('John');
      expect(userInfo.lastName).toBe('Doe');
      expect(userInfo.displayName).toBe('John Doe');
      expect(userInfo.externalId).toBe('user@example.com');
    });

    it('should fall back to nameId if email attribute is missing', () => {
      const xmlNoEmail = samlXml.replace(
        /<saml:Attribute Name="email">[\s\S]*?<\/saml:Attribute>/,
        '',
      );
      const base64NoEmail = Buffer.from(xmlNoEmail).toString('base64');
      const assertion = parser.parse(base64NoEmail, provider);
      const userInfo = parser.mapToUserInfo(assertion, provider.attributeMapping);
      expect(userInfo.email).toBe('user@example.com');
    });
  });

  describe('generateAuthnRequest', () => {
    it('should generate a valid AuthnRequest XML', () => {
      const xml = parser.generateAuthnRequest(provider, 'req-123');
      expect(xml).toContain('AuthnRequest');
      expect(xml).toContain('req-123');
      expect(xml).toContain(provider.ssoUrl);
      expect(xml).toContain(provider.spEntityId);
      expect(xml).toContain(provider.acsUrl);
    });
  });

  describe('createRedirectUrl', () => {
    it('should create a redirect URL with SAMLRequest parameter', () => {
      const url = parser.createRedirectUrl(provider, 'req-123');
      expect(url).toContain(provider.ssoUrl);
      expect(url).toContain('SAMLRequest=');
    });

    it('should handle SSO URL with existing query params', () => {
      const providerWithQuery = SamlProvider.create({
        providerId: 'p-2',
        organizationId: 'org-1',
        name: 'Test IdP',
        entityId: 'https://idp.example.com',
        ssoUrl: 'https://idp.example.com/sso?existing=param',
        certificate: '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----',
        spEntityId: 'https://sp.example.com',
        acsUrl: 'https://sp.example.com/acs',
      });
      const url = parser.createRedirectUrl(providerWithQuery, 'req-123');
      expect(url).toContain('&SAMLRequest=');
    });
  });
});
