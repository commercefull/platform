/**
 * SAML Assertion Parser
 *
 * Parses and verifies SAML 2.0 assertions.
 * In production, this would use a library like @node-saml/passport-saml.
 * For now, we implement a minimal parser that extracts attributes from
 * a base64-encoded SAML response.
 */

import { SamlAssertionError } from '../../domain/errors/SsoErrors';
import { SamlProvider, SamlAttributeMapping } from '../../domain/entities/SamlProvider';
import { logger } from '../../../../libs/logger';

export interface SamlAssertionResult {
  nameId: string;
  nameIdFormat: string;
  attributes: Record<string, string>;
  issuer: string;
  notBefore: Date;
  notOnOrAfter: Date;
  sessionIndex?: string;
}

export interface SamlUserInfo {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  externalId: string;
  rawAttributes: Record<string, string>;
}

export class SamlAssertionParser {
  /**
   * Parse a base64-encoded SAML response into assertion data.
   * This is a simplified parser — production use should use a proper SAML library.
   */
  parse(samlResponse: string, provider: SamlProvider): SamlAssertionResult {
    let xml: string;
    try {
      xml = Buffer.from(samlResponse, 'base64').toString('utf-8');
    } catch {
      throw new SamlAssertionError('Invalid base64 encoding');
    }

    if (!xml.includes('<saml:Assertion') && !xml.includes('<Assertion')) {
      throw new SamlAssertionError('No SAML assertion found in response');
    }

    const nameId = this.extractValue(xml, 'NameID');
    if (!nameId) throw new SamlAssertionError('NameID not found in assertion');

    const nameIdFormat = this.extractAttribute(xml, 'NameID', 'Format') || 'unspecified';
    const issuer = this.extractValue(xml, 'Issuer') || '';
    const notBefore = this.extractValue(xml, 'NotBefore');
    const notOnOrAfter = this.extractValue(xml, 'NotOnOrAfter');
    const sessionIndex = this.extractAttribute(xml, 'AuthnStatement', 'SessionIndex');

    const attributes = this.extractAttributes(xml);

    const result: SamlAssertionResult = {
      nameId,
      nameIdFormat,
      attributes,
      issuer,
      notBefore: notBefore ? new Date(notBefore) : new Date(),
      notOnOrAfter: notOnOrAfter ? new Date(notOnOrAfter) : new Date(Date.now() + 3600000),
      sessionIndex,
    };

    // Verify issuer matches expected entity ID
    if (issuer && provider.entityId && issuer !== provider.entityId) {
      logger.warn('SAML issuer mismatch', { expected: provider.entityId, actual: issuer });
    }

    // Verify time validity
    const now = new Date();
    if (result.notBefore > now) {
      throw new SamlAssertionError('Assertion not yet valid');
    }
    if (result.notOnOrAfter <= now) {
      throw new SamlAssertionError('Assertion has expired');
    }

    return result;
  }

  /**
   * Map SAML assertion attributes to user info using the provider's attribute mapping.
   */
  mapToUserInfo(assertion: SamlAssertionResult, mapping: SamlAttributeMapping): SamlUserInfo {
    const attrs = assertion.attributes;

    const email = attrs[mapping.email] || assertion.nameId;
    if (!email) throw new SamlAssertionError('Email not found in SAML assertion');

    return {
      email,
      firstName: attrs[mapping.firstName],
      lastName: attrs[mapping.lastName],
      displayName: attrs[mapping.displayName],
      externalId: assertion.nameId,
      rawAttributes: attrs,
    };
  }

  /**
   * Generate a SAML AuthnRequest XML for redirect binding.
   */
  generateAuthnRequest(provider: SamlProvider, requestId: string): string {
    const issueInstant = new Date().toISOString();
    const assertionConsumerServiceUrl = provider.acsUrl;
    const entityId = provider.spEntityId;

    return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${requestId}" Version="2.0" IssueInstant="${issueInstant}" Destination="${provider.ssoUrl}" AssertionConsumerServiceURL="${assertionConsumerServiceUrl}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:${provider.binding === 'post' ? 'HTTP-POST' : 'HTTP-Redirect'}"><saml:Issuer>${entityId}</saml:Issuer><samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:${provider.nameIdFormat}" AllowCreate="true"/></samlp:AuthnRequest>`;
  }

  /**
   * Create a redirect URL for SAML SSO with the AuthnRequest as a query parameter.
   */
  createRedirectUrl(provider: SamlProvider, requestId: string): string {
    const request = this.generateAuthnRequest(provider, requestId);
    const encoded = Buffer.from(request).toString('base64');
    const separator = provider.ssoUrl.includes('?') ? '&' : '?';
    return `${provider.ssoUrl}${separator}SAMLRequest=${encodeURIComponent(encoded)}`;
  }

  private extractValue(xml: string, tag: string): string | undefined {
    // Try with namespace prefix first, then without
    const patterns = [
      new RegExp(`<(?:saml:)?${tag}[^>]*>([^<]+)</(?:saml:)?${tag}>`, 'i'),
      new RegExp(`<(?:samlp:)?${tag}[^>]*>([^<]+)</(?:samlp:)?${tag}>`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = xml.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return undefined;
  }

  private extractAttribute(xml: string, tag: string, attr: string): string | undefined {
    const pattern = new RegExp(`<(?:saml:)?${tag}[^>]*\\s${attr}="([^"]+)"`, 'i');
    const match = xml.match(pattern);
    return match?.[1];
  }

  private extractAttributes(xml: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    // Match <saml:Attribute Name="..."><saml:AttributeValue>...</saml:AttributeValue></saml:Attribute>
    const pattern = /<(?:saml:)?Attribute\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/(?:saml:)?Attribute>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(xml)) !== null) {
      const name = match[1];
      const valueMatch = match[2].match(/<(?:saml:)?AttributeValue[^>]*>([^<]+)<\/(?:saml:)?AttributeValue>/i);
      if (valueMatch?.[1]) {
        attributes[name] = valueMatch[1].trim();
      }
    }
    return attributes;
  }
}
