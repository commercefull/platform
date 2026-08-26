/**
 * IntegrationCredential Entity
 *
 * Stores encrypted credentials for a third-party integration.
 * Supports API keys, OAuth tokens, basic auth, and custom credential types.
 */

export type CredentialType = 'api_key' | 'oauth_token' | 'basic_auth' | 'webhook_secret' | 'custom';

export interface IntegrationCredentialProps {
  credentialId: string;
  integrationId: string;
  type: CredentialType;
  label: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationCredential {
  private props: IntegrationCredentialProps;

  private constructor(props: IntegrationCredentialProps) {
    this.props = props;
  }

  static create(params: {
    credentialId: string;
    integrationId: string;
    type: CredentialType;
    label: string;
    encryptedData: string;
    iv: string;
    authTag: string;
    expiresAt?: Date;
  }): IntegrationCredential {
    const now = new Date();
    return new IntegrationCredential({
      credentialId: params.credentialId,
      integrationId: params.integrationId,
      type: params.type,
      label: params.label,
      encryptedData: params.encryptedData,
      iv: params.iv,
      authTag: params.authTag,
      expiresAt: params.expiresAt ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: IntegrationCredentialProps): IntegrationCredential {
    return new IntegrationCredential(props);
  }

  get credentialId(): string { return this.props.credentialId; }
  get integrationId(): string { return this.props.integrationId; }
  get type(): CredentialType { return this.props.type; }
  get label(): string { return this.props.label; }
  get encryptedData(): string { return this.props.encryptedData; }
  get iv(): string { return this.props.iv; }
  get authTag(): string { return this.props.authTag; }
  get expiresAt(): Date | null { return this.props.expiresAt; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt.getTime() < Date.now();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  updateEncryptedData(encryptedData: string, iv: string, authTag: string): void {
    this.props.encryptedData = encryptedData;
    this.props.iv = iv;
    this.props.authTag = authTag;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      credentialId: this.props.credentialId,
      integrationId: this.props.integrationId,
      type: this.props.type,
      label: this.props.label,
      expiresAt: this.props.expiresAt,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
