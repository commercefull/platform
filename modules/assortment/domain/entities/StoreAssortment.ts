/**
 * StoreAssortment Entity (Aggregate Root)
 *
 * Controls which products a store sells. One row per store; a missing row
 * behaves like `mode: 'all'` (resolve treats absent config as full catalog).
 *
 * Modes:
 * - `all`     — entire catalog minus `exclude` entries
 * - `include` — only `include` entries (products, collections, categories)
 * - `exclude` — entire catalog minus `exclude` entries (alias of `all` with
 *               explicit intent; kept distinct so intent survives edits)
 */

export type AssortmentMode = 'all' | 'include' | 'exclude';

export interface StoreAssortmentProps {
  storeId: string;
  mode: AssortmentMode;
  createdAt: Date;
  updatedAt: Date;
}

export class StoreAssortment {
  private constructor(private props: StoreAssortmentProps) {}

  static create(storeId: string, mode: AssortmentMode = 'all'): StoreAssortment {
    const now = new Date();
    return new StoreAssortment({ storeId, mode, createdAt: now, updatedAt: now });
  }

  static reconstitute(props: StoreAssortmentProps): StoreAssortment {
    return new StoreAssortment(props);
  }

  get storeId(): string {
    return this.props.storeId;
  }
  get mode(): AssortmentMode {
    return this.props.mode;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  setMode(mode: AssortmentMode): void {
    this.props.mode = mode;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      storeId: this.props.storeId,
      mode: this.props.mode,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
