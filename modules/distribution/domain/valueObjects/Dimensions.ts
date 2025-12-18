/**
 * Dimensions Value Object
 * Immutable representation of package dimensions
 */
export type DimensionUnit = 'cm' | 'in' | 'm';

export interface DimensionsProps {
  length: number;
  width: number;
  height: number;
  unit: DimensionUnit;
}

const CONVERSION_TO_CM: Record<DimensionUnit, number> = {
  cm: 1,
  in: 2.54,
  m: 100
};

export class Dimensions {
  private constructor(
    private readonly _length: number,
    private readonly _width: number,
    private readonly _height: number,
    private readonly _unit: DimensionUnit
  ) {}

  static create(length: number, width: number, height: number, unit: DimensionUnit = 'cm'): Dimensions {
    if (length < 0 || width < 0 || height < 0) {
      throw new Error('Dimensions cannot be negative');
    }
    return new Dimensions(length, width, height, unit);
  }

  get length(): number { return this._length; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get unit(): DimensionUnit { return this._unit; }

  /**
   * Calculate volume in cubic centimeters
   */
  getVolumeCm3(): number {
    const factor = CONVERSION_TO_CM[this._unit];
    return (this._length * factor) * (this._width * factor) * (this._height * factor);
  }

  /**
   * Calculate dimensional weight (volumetric weight) in kg
   * Standard divisor is 5000 for cm³ to kg
   */
  getDimensionalWeight(divisor: number = 5000): number {
    return this.getVolumeCm3() / divisor;
  }

  /**
   * Get the longest side (for carrier restrictions)
   */
  getLongestSide(): number {
    return Math.max(this._length, this._width, this._height);
  }

  /**
   * Get girth (2 * (width + height)) - used by some carriers
   */
  getGirth(): number {
    const sides = [this._length, this._width, this._height].sort((a, b) => b - a);
    return 2 * (sides[1] + sides[2]);
  }

  /**
   * Get length + girth - common carrier restriction
   */
  getLengthPlusGirth(): number {
    const sides = [this._length, this._width, this._height].sort((a, b) => b - a);
    return sides[0] + 2 * (sides[1] + sides[2]);
  }

  convertTo(targetUnit: DimensionUnit): Dimensions {
    const factor = CONVERSION_TO_CM[this._unit] / CONVERSION_TO_CM[targetUnit];
    return Dimensions.create(
      Math.round(this._length * factor * 100) / 100,
      Math.round(this._width * factor * 100) / 100,
      Math.round(this._height * factor * 100) / 100,
      targetUnit
    );
  }

  fitsInside(container: Dimensions): boolean {
    const thisCm = this.convertTo('cm');
    const containerCm = container.convertTo('cm');
    
    const thisSides = [thisCm._length, thisCm._width, thisCm._height].sort((a, b) => a - b);
    const containerSides = [containerCm._length, containerCm._width, containerCm._height].sort((a, b) => a - b);
    
    return thisSides[0] <= containerSides[0] &&
           thisSides[1] <= containerSides[1] &&
           thisSides[2] <= containerSides[2];
  }

  equals(other: Dimensions): boolean {
    const thisCm = this.convertTo('cm');
    const otherCm = other.convertTo('cm');
    return (
      Math.abs(thisCm._length - otherCm._length) < 0.01 &&
      Math.abs(thisCm._width - otherCm._width) < 0.01 &&
      Math.abs(thisCm._height - otherCm._height) < 0.01
    );
  }

  format(): string {
    return `${this._length} x ${this._width} x ${this._height} ${this._unit}`;
  }

  toJSON(): DimensionsProps {
    return {
      length: this._length,
      width: this._width,
      height: this._height,
      unit: this._unit
    };
  }
}
