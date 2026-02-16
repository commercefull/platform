/**
 * Assortment Aggregate Root
 *
 * Represents a curated collection of products grouped for
 * merchandising, channel, or storefront display purposes.
 */

export type AssortmentStatus = 'active' | 'inactive' | 'draft';

export interface AssortmentProps {
  assortmentId: string;
  name: string;
  description?: string;
  slug: string;
  status: AssortmentStatus;
  scope?: string;
  merchantId?: string;
  channelId?: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AssortmentItemProps {
  assortmentItemId: string;
  assortmentId: string;
  productId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export class Assortment {
  private props: AssortmentProps;

  constructor(props: AssortmentProps) {
    this.props = props;
  }

  get assortmentId(): string {
    return this.props.assortmentId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get status(): AssortmentStatus {
    return this.props.status;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  activate(): void {
    this.props.status = 'active';
  }

  deactivate(): void {
    this.props.status = 'inactive';
  }

  toJSON(): AssortmentProps {
    return { ...this.props };
  }
}
