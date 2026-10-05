/**
 * StoreAssortmentEntry Entity
 *
 * A single include/exclude rule inside a store's assortment. `targetType`
 * decides what `targetId` points at:
 * - `product`    — a specific product (supports `position`/`isHidden` overrides)
 * - `collection` — the collection's resolved membership is included dynamically
 * - `category`   — all products in the category
 */

export type AssortmentTargetType = 'product' | 'collection' | 'category';
export type AssortmentEffect = 'include' | 'exclude';

export interface StoreAssortmentEntryProps {
  assortmentStoreEntryId: string;
  storeId: string;
  /** Optional sales channel scope — when set the entry applies only to that channel's catalog. */
  channelId?: string;
  targetType: AssortmentTargetType;
  targetId: string;
  effect: AssortmentEffect;
  position: number;
  isHidden: boolean;
  createdAt: Date;
}

export class StoreAssortmentEntry {
  private constructor(private readonly props: StoreAssortmentEntryProps) {}

  static create(params: {
    assortmentStoreEntryId: string;
    storeId: string;
    channelId?: string;
    targetType: AssortmentTargetType;
    targetId: string;
    effect: AssortmentEffect;
    position?: number;
    isHidden?: boolean;
  }): StoreAssortmentEntry {
    return new StoreAssortmentEntry({
      assortmentStoreEntryId: params.assortmentStoreEntryId,
      storeId: params.storeId,
      channelId: params.channelId,
      targetType: params.targetType,
      targetId: params.targetId,
      effect: params.effect,
      position: params.position ?? 0,
      isHidden: params.isHidden ?? false,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: StoreAssortmentEntryProps): StoreAssortmentEntry {
    return new StoreAssortmentEntry(props);
  }

  get assortmentStoreEntryId(): string {
    return this.props.assortmentStoreEntryId;
  }
  get storeId(): string {
    return this.props.storeId;
  }
  get channelId(): string | undefined {
    return this.props.channelId;
  }
  get targetType(): AssortmentTargetType {
    return this.props.targetType;
  }
  get targetId(): string {
    return this.props.targetId;
  }
  get effect(): AssortmentEffect {
    return this.props.effect;
  }
  get position(): number {
    return this.props.position;
  }
  get isHidden(): boolean {
    return this.props.isHidden;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): Record<string, unknown> {
    return {
      assortmentStoreEntryId: this.props.assortmentStoreEntryId,
      storeId: this.props.storeId,
      channelId: this.props.channelId,
      targetType: this.props.targetType,
      targetId: this.props.targetId,
      effect: this.props.effect,
      position: this.props.position,
      isHidden: this.props.isHidden,
      createdAt: this.props.createdAt,
    };
  }
}
