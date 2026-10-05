import { StoreValidationError } from '../errors/StoreErrors';

export type SalesChannelType = 'web' | 'marketplace' | 'social' | 'pos' | 'agentic' | 'api' | 'other';
export type SalesChannelStatus = 'active' | 'inactive';

export interface SalesChannelProps {
  salesChannelId: string;
  organizationId: string;
  code: string;
  name: string;
  type: SalesChannelType;
  status: SalesChannelStatus;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreSalesChannel {
  storeSalesChannelId: string;
  storeId: string;
  salesChannelId: string;
  isDefault: boolean;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  channel?: SalesChannel;
}

const CHANNEL_TYPES: SalesChannelType[] = ['web', 'marketplace', 'social', 'pos', 'agentic', 'api', 'other'];

export class SalesChannel {
  private constructor(private props: SalesChannelProps) {}

  static create(props: {
    salesChannelId: string;
    organizationId: string;
    code: string;
    name: string;
    type: SalesChannelType;
    status?: SalesChannelStatus;
    config?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): SalesChannel {
    if (!props.organizationId) throw new StoreValidationError('Sales channel requires an organizationId');
    if (!props.name?.trim()) throw new StoreValidationError('Sales channel requires a name');
    if (!CHANNEL_TYPES.includes(props.type)) throw new StoreValidationError(`Unsupported sales channel type '${props.type}'`);
    const code = SalesChannel.normalizeCode(props.code);
    if (!code) throw new StoreValidationError('Sales channel requires a code');
    const now = new Date();
    return new SalesChannel({
      ...props,
      code,
      name: props.name.trim(),
      status: props.status ?? 'active',
      config: props.config ?? {},
      metadata: props.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SalesChannelProps): SalesChannel {
    return new SalesChannel(props);
  }

  static normalizeCode(code: string): string {
    return code
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  get salesChannelId(): string {
    return this.props.salesChannelId;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get type(): SalesChannelType {
    return this.props.type;
  }
  get status(): SalesChannelStatus {
    return this.props.status;
  }
  get config(): Record<string, unknown> {
    return this.props.config;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(updates: {
    name?: string;
    type?: SalesChannelType;
    status?: SalesChannelStatus;
    config?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): void {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) throw new StoreValidationError('Sales channel requires a name');
      this.props.name = updates.name.trim();
    }
    if (updates.type !== undefined) {
      if (!CHANNEL_TYPES.includes(updates.type)) throw new StoreValidationError(`Unsupported sales channel type '${updates.type}'`);
      this.props.type = updates.type;
    }
    if (updates.status !== undefined) this.props.status = updates.status;
    if (updates.config !== undefined) this.props.config = updates.config;
    if (updates.metadata !== undefined) this.props.metadata = updates.metadata;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      salesChannelId: this.props.salesChannelId,
      organizationId: this.props.organizationId,
      code: this.props.code,
      name: this.props.name,
      type: this.props.type,
      status: this.props.status,
      config: this.props.config,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
