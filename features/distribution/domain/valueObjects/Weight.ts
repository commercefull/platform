/**
 * Weight Value Object
 * Immutable representation of weight with unit conversion
 */
export type WeightUnit = 'kg' | 'g' | 'lb' | 'oz';

export interface WeightProps {
  value: number;
  unit: WeightUnit;
}

const CONVERSION_TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592
};

export class Weight {
  private constructor(
    private readonly _value: number,
    private readonly _unit: WeightUnit
  ) {}

  static create(value: number, unit: WeightUnit = 'kg'): Weight {
    if (value < 0) {
      throw new Error('Weight cannot be negative');
    }
    return new Weight(value, unit);
  }

  static zero(unit: WeightUnit = 'kg'): Weight {
    return Weight.create(0, unit);
  }

  get value(): number { return this._value; }
  get unit(): WeightUnit { return this._unit; }

  toGrams(): number {
    return this._value * CONVERSION_TO_GRAMS[this._unit];
  }

  toKilograms(): number {
    return this.toGrams() / 1000;
  }

  toPounds(): number {
    return this.toGrams() / CONVERSION_TO_GRAMS.lb;
  }

  convertTo(targetUnit: WeightUnit): Weight {
    const grams = this.toGrams();
    const convertedValue = grams / CONVERSION_TO_GRAMS[targetUnit];
    return Weight.create(Math.round(convertedValue * 1000) / 1000, targetUnit);
  }

  add(other: Weight): Weight {
    const totalGrams = this.toGrams() + other.toGrams();
    return Weight.create(totalGrams / CONVERSION_TO_GRAMS[this._unit], this._unit);
  }

  isGreaterThan(other: Weight): boolean {
    return this.toGrams() > other.toGrams();
  }

  isLessThan(other: Weight): boolean {
    return this.toGrams() < other.toGrams();
  }

  isWithinRange(min: Weight, max: Weight): boolean {
    const grams = this.toGrams();
    return grams >= min.toGrams() && grams <= max.toGrams();
  }

  equals(other: Weight): boolean {
    return Math.abs(this.toGrams() - other.toGrams()) < 0.001;
  }

  format(): string {
    return `${this._value} ${this._unit}`;
  }

  toJSON(): WeightProps {
    return { value: this._value, unit: this._unit };
  }
}
