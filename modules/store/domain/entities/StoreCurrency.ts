/**
 * StoreCurrency Entity
 * A currency membership for a store — which currencies the store sells in.
 * Exactly one currency per store is the default.
 */

import { StoreValidationError } from '../errors/StoreErrors';

export interface StoreCurrencyProps {
  storeCurrencyId: string;
  storeId: string;
  currencyId: string;
  /** ISO code resolved from the currency table (e.g. 'USD'). */
  currencyCode?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StoreCurrency {
  private props: StoreCurrencyProps;

  private constructor(props: StoreCurrencyProps) {
    this.props = props;
  }

  static create(props: {
    storeCurrencyId: string;
    storeId: string;
    currencyId: string;
    currencyCode?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }): StoreCurrency {
    if (!props.storeId) {
      throw new StoreValidationError('Store currency requires a storeId');
    }
    if (!props.currencyId) {
      throw new StoreValidationError('Store currency requires a currencyId');
    }

    const now = new Date();
    return new StoreCurrency({
      storeCurrencyId: props.storeCurrencyId,
      storeId: props.storeId,
      currencyId: props.currencyId,
      currencyCode: props.currencyCode,
      isDefault: props.isDefault ?? false,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: StoreCurrencyProps): StoreCurrency {
    return new StoreCurrency(props);
  }

  get storeCurrencyId(): string {
    return this.props.storeCurrencyId;
  }
  get storeId(): string {
    return this.props.storeId;
  }
  get currencyId(): string {
    return this.props.currencyId;
  }
  get currencyCode(): string | undefined {
    return this.props.currencyCode;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  markAsDefault(): void {
    this.props.isDefault = true;
    this.touch();
  }

  clearDefault(): void {
    this.props.isDefault = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      storeCurrencyId: this.props.storeCurrencyId,
      storeId: this.props.storeId,
      currencyId: this.props.currencyId,
      currencyCode: this.props.currencyCode,
      isDefault: this.props.isDefault,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
