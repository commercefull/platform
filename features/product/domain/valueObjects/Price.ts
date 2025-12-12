/**
 * Price Value Object
 * Represents product pricing with base and sale prices
 */

export class Price {
  private constructor(
    private readonly _basePrice: number,
    private readonly _salePrice: number | null,
    private readonly _cost: number | null,
    private readonly _currency: string
  ) {}

  static create(
    basePrice: number, 
    currency: string = 'USD',
    salePrice?: number,
    cost?: number
  ): Price {
    if (basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }
    if (salePrice !== undefined && salePrice < 0) {
      throw new Error('Sale price cannot be negative');
    }
    if (salePrice !== undefined && salePrice > basePrice) {
      throw new Error('Sale price cannot be greater than base price');
    }
    return new Price(basePrice, salePrice ?? null, cost ?? null, currency.toUpperCase());
  }

  static zero(currency: string = 'USD'): Price {
    return new Price(0, null, null, currency.toUpperCase());
  }

  get basePrice(): number {
    return this._basePrice;
  }

  get salePrice(): number | null {
    return this._salePrice;
  }

  get cost(): number | null {
    return this._cost;
  }

  get currency(): string {
    return this._currency;
  }

  get effectivePrice(): number {
    return this._salePrice ?? this._basePrice;
  }

  get isOnSale(): boolean {
    return this._salePrice !== null && this._salePrice < this._basePrice;
  }

  get discountAmount(): number {
    if (!this.isOnSale) return 0;
    return this._basePrice - (this._salePrice ?? this._basePrice);
  }

  get discountPercentage(): number {
    if (!this.isOnSale || this._basePrice === 0) return 0;
    return Math.round((this.discountAmount / this._basePrice) * 100);
  }

  get profitMargin(): number | null {
    if (this._cost === null) return null;
    return this.effectivePrice - this._cost;
  }

  get profitMarginPercentage(): number | null {
    if (this._cost === null || this.effectivePrice === 0) return null;
    return Math.round(((this.effectivePrice - this._cost) / this.effectivePrice) * 100);
  }

  setSalePrice(salePrice: number | null): Price {
    if (salePrice !== null && salePrice > this._basePrice) {
      throw new Error('Sale price cannot be greater than base price');
    }
    return new Price(this._basePrice, salePrice, this._cost, this._currency);
  }

  updateBasePrice(basePrice: number): Price {
    if (basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }
    const newSalePrice = this._salePrice !== null && this._salePrice > basePrice 
      ? null 
      : this._salePrice;
    return new Price(basePrice, newSalePrice, this._cost, this._currency);
  }

  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency
    }).format(this.effectivePrice);
  }

  formatBasePrice(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency
    }).format(this._basePrice);
  }

  toJSON(): Record<string, any> {
    return {
      basePrice: this._basePrice,
      salePrice: this._salePrice,
      cost: this._cost,
      currency: this._currency,
      effectivePrice: this.effectivePrice,
      isOnSale: this.isOnSale,
      discountAmount: this.discountAmount,
      discountPercentage: this.discountPercentage
    };
  }
}
