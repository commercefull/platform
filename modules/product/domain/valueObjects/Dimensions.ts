/**
 * Dimensions Value Object
 * Represents product physical dimensions and weight
 */

export type WeightUnit = 'kg' | 'lb' | 'oz' | 'g';
export type DimensionUnit = 'cm' | 'in' | 'm' | 'mm';

export class Dimensions {
  private constructor(
    private readonly _weight: number | null,
    private readonly _weightUnit: WeightUnit,
    private readonly _length: number | null,
    private readonly _width: number | null,
    private readonly _height: number | null,
    private readonly _dimensionUnit: DimensionUnit
  ) {}

  static create(props: {
    weight?: number;
    weightUnit?: WeightUnit;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: DimensionUnit;
  }): Dimensions {
    return new Dimensions(
      props.weight ?? null,
      props.weightUnit ?? 'kg',
      props.length ?? null,
      props.width ?? null,
      props.height ?? null,
      props.dimensionUnit ?? 'cm'
    );
  }

  static empty(): Dimensions {
    return new Dimensions(null, 'kg', null, null, null, 'cm');
  }

  get weight(): number | null {
    return this._weight;
  }

  get weightUnit(): WeightUnit {
    return this._weightUnit;
  }

  get length(): number | null {
    return this._length;
  }

  get width(): number | null {
    return this._width;
  }

  get height(): number | null {
    return this._height;
  }

  get dimensionUnit(): DimensionUnit {
    return this._dimensionUnit;
  }

  get hasWeight(): boolean {
    return this._weight !== null && this._weight > 0;
  }

  get hasDimensions(): boolean {
    return this._length !== null || this._width !== null || this._height !== null;
  }

  get volume(): number | null {
    if (this._length === null || this._width === null || this._height === null) {
      return null;
    }
    return this._length * this._width * this._height;
  }

  /**
   * Convert weight to kilograms
   */
  get weightInKg(): number | null {
    if (this._weight === null) return null;
    
    const conversions: Record<WeightUnit, number> = {
      'kg': 1,
      'lb': 0.453592,
      'oz': 0.0283495,
      'g': 0.001
    };
    
    return this._weight * conversions[this._weightUnit];
  }

  /**
   * Convert dimensions to centimeters
   */
  get dimensionsInCm(): { length: number | null; width: number | null; height: number | null } {
    const conversions: Record<DimensionUnit, number> = {
      'cm': 1,
      'in': 2.54,
      'm': 100,
      'mm': 0.1
    };
    
    const factor = conversions[this._dimensionUnit];
    
    return {
      length: this._length !== null ? this._length * factor : null,
      width: this._width !== null ? this._width * factor : null,
      height: this._height !== null ? this._height * factor : null
    };
  }

  formatWeight(): string {
    if (this._weight === null) return 'N/A';
    return `${this._weight} ${this._weightUnit}`;
  }

  formatDimensions(): string {
    if (!this.hasDimensions) return 'N/A';
    const parts = [
      this._length !== null ? `L: ${this._length}` : null,
      this._width !== null ? `W: ${this._width}` : null,
      this._height !== null ? `H: ${this._height}` : null
    ].filter(Boolean);
    return `${parts.join(' x ')} ${this._dimensionUnit}`;
  }

  toJSON(): Record<string, any> {
    return {
      weight: this._weight,
      weightUnit: this._weightUnit,
      length: this._length,
      width: this._width,
      height: this._height,
      dimensionUnit: this._dimensionUnit,
      volume: this.volume,
      weightInKg: this.weightInKg
    };
  }
}
