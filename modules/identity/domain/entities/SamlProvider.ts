/**
 * SAML Provider Entity
 *
 * Per-organization SAML 2.0 IdP configuration.
 * Stores metadata, certificates, attribute mappings, and signing preferences.
 */

import { SsoValidationError } from '../errors/SsoErrors';

export type SamlBinding = 'redirect' | 'post';
export type SamlNameIdFormat = 'unspecified' | 'emailAddress' | 'persistent' | 'transient';

export interface SamlAttributeMapping {
  /** Maps SAML attribute names to platform user fields */
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  /** Additional attributes to store as metadata */
  extra?: Record<string, string>;
}

export interface SamlProviderProps {
  providerId: string;
  organizationId: string;
  name: string;
  /** IdP entity ID (usually a URL) */
  entityId: string;
  /** IdP SSO URL (where AuthnRequest is sent) */
  ssoUrl: string;
  /** IdP SLO URL (logout, optional) */
  sloUrl?: string;
  /** IdP X.509 certificate (PEM format) for signing/assertion verification */
  certificate: string;
  /** SP entity ID (our entity ID, usually our ACS URL) */
  spEntityId: string;
  /** Assertion Consumer Service URL */
  acsUrl: string;
  /** SAML binding for AuthnRequest */
  binding: SamlBinding;
  /** NameID format to request */
  nameIdFormat: SamlNameIdFormat;
  /** Whether to sign AuthnRequest */
  signAuthnRequest: boolean;
  /** SP private key (PEM, for signed requests — optional) */
  spPrivateKey?: string;
  /** SP certificate (PEM, for signed requests — optional) */
  spCertificate?: string;
  /** Attribute mapping from SAML attributes to user fields */
  attributeMapping: SamlAttributeMapping;
  /** Whether this provider is active */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SamlProvider {
  private props: SamlProviderProps;

  private constructor(props: SamlProviderProps) {
    this.props = props;
  }

  static create(params: {
    providerId: string;
    organizationId: string;
    name: string;
    entityId: string;
    ssoUrl: string;
    certificate: string;
    spEntityId: string;
    acsUrl: string;
    binding?: SamlBinding;
    nameIdFormat?: SamlNameIdFormat;
    signAuthnRequest?: boolean;
    sloUrl?: string;
    spPrivateKey?: string;
    spCertificate?: string;
    attributeMapping?: Partial<SamlAttributeMapping>;
  }): SamlProvider {
    if (!params.organizationId?.trim()) throw new SsoValidationError('Organization ID is required');
    if (!params.name?.trim()) throw new SsoValidationError('Provider name is required');
    if (!params.entityId?.trim()) throw new SsoValidationError('IdP entity ID is required');
    if (!params.ssoUrl?.trim()) throw new SsoValidationError('IdP SSO URL is required');
    if (!params.certificate?.trim()) throw new SsoValidationError('IdP certificate is required');
    if (!params.spEntityId?.trim()) throw new SsoValidationError('SP entity ID is required');
    if (!params.acsUrl?.trim()) throw new SsoValidationError('ACS URL is required');

    const now = new Date();
    return new SamlProvider({
      providerId: params.providerId,
      organizationId: params.organizationId,
      name: params.name,
      entityId: params.entityId,
      ssoUrl: params.ssoUrl,
      sloUrl: params.sloUrl,
      certificate: params.certificate,
      spEntityId: params.spEntityId,
      acsUrl: params.acsUrl,
      binding: params.binding || 'redirect',
      nameIdFormat: params.nameIdFormat || 'emailAddress',
      signAuthnRequest: params.signAuthnRequest ?? false,
      spPrivateKey: params.spPrivateKey,
      spCertificate: params.spCertificate,
      attributeMapping: {
        email: params.attributeMapping?.email || 'email',
        firstName: params.attributeMapping?.firstName || 'givenName',
        lastName: params.attributeMapping?.lastName || 'surname',
        displayName: params.attributeMapping?.displayName || 'displayName',
        extra: params.attributeMapping?.extra,
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SamlProviderProps): SamlProvider {
    return new SamlProvider(props);
  }

  // Getters
  get providerId(): string { return this.props.providerId; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get entityId(): string { return this.props.entityId; }
  get ssoUrl(): string { return this.props.ssoUrl; }
  get sloUrl(): string | undefined { return this.props.sloUrl; }
  get certificate(): string { return this.props.certificate; }
  get spEntityId(): string { return this.props.spEntityId; }
  get acsUrl(): string { return this.props.acsUrl; }
  get binding(): SamlBinding { return this.props.binding; }
  get nameIdFormat(): SamlNameIdFormat { return this.props.nameIdFormat; }
  get signAuthnRequest(): boolean { return this.props.signAuthnRequest; }
  get spPrivateKey(): string | undefined { return this.props.spPrivateKey; }
  get spCertificate(): string | undefined { return this.props.spCertificate; }
  get attributeMapping(): SamlAttributeMapping { return this.props.attributeMapping; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Domain methods
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updateCertificate(certificate: string): void {
    if (!certificate?.trim()) throw new SsoValidationError('Certificate is required');
    this.props.certificate = certificate;
    this.touch();
  }

  updateAttributeMapping(mapping: Partial<SamlAttributeMapping>): void {
    this.props.attributeMapping = {
      ...this.props.attributeMapping,
      ...mapping,
    };
    this.touch();
  }

  updateMetadata(params: {
    name?: string;
    entityId?: string;
    ssoUrl?: string;
    sloUrl?: string;
    certificate?: string;
    spEntityId?: string;
    acsUrl?: string;
    binding?: SamlBinding;
    nameIdFormat?: SamlNameIdFormat;
    signAuthnRequest?: boolean;
  }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.entityId !== undefined) this.props.entityId = params.entityId;
    if (params.ssoUrl !== undefined) this.props.ssoUrl = params.ssoUrl;
    if (params.sloUrl !== undefined) this.props.sloUrl = params.sloUrl;
    if (params.certificate !== undefined) this.props.certificate = params.certificate;
    if (params.spEntityId !== undefined) this.props.spEntityId = params.spEntityId;
    if (params.acsUrl !== undefined) this.props.acsUrl = params.acsUrl;
    if (params.binding !== undefined) this.props.binding = params.binding;
    if (params.nameIdFormat !== undefined) this.props.nameIdFormat = params.nameIdFormat;
    if (params.signAuthnRequest !== undefined) this.props.signAuthnRequest = params.signAuthnRequest;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      providerId: this.props.providerId,
      organizationId: this.props.organizationId,
      name: this.props.name,
      entityId: this.props.entityId,
      ssoUrl: this.props.ssoUrl,
      sloUrl: this.props.sloUrl,
      certificate: this.props.certificate,
      spEntityId: this.props.spEntityId,
      acsUrl: this.props.acsUrl,
      binding: this.props.binding,
      nameIdFormat: this.props.nameIdFormat,
      signAuthnRequest: this.props.signAuthnRequest,
      hasSpPrivateKey: !!this.props.spPrivateKey,
      hasSpCertificate: !!this.props.spCertificate,
      attributeMapping: this.props.attributeMapping,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
