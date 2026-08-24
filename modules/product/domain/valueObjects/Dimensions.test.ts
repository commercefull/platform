import { Dimensions } from './Dimensions';

describe('Dimensions', () => {
  it('should create with all properties', () => {
    const d = Dimensions.create({ weight: 2.5, length: 10, width: 5, height: 3 });
    expect(d.weight).toBe(2.5);
    expect(d.length).toBe(10);
    expect(d.width).toBe(5);
    expect(d.height).toBe(3);
    expect(d.hasWeight).toBe(true);
    expect(d.hasDimensions).toBe(true);
  });

  it('should create empty dimensions', () => {
    const d = Dimensions.empty();
    expect(d.weight).toBeNull();
    expect(d.length).toBeNull();
    expect(d.hasWeight).toBe(false);
    expect(d.hasDimensions).toBe(false);
  });

  it('should use default units', () => {
    const d = Dimensions.create({});
    expect(d.weightUnit).toBe('kg');
    expect(d.dimensionUnit).toBe('cm');
  });

  it('should calculate volume', () => {
    const d = Dimensions.create({ length: 10, width: 5, height: 3 });
    expect(d.volume).toBe(150);
  });

  it('should return null volume when dimensions missing', () => {
    const d = Dimensions.create({ length: 10 });
    expect(d.volume).toBeNull();
  });

  it('should convert weight to kg', () => {
    const dLb = Dimensions.create({ weight: 2, weightUnit: 'lb' });
    expect(dLb.weightInKg).toBeCloseTo(0.907, 2);

    const dG = Dimensions.create({ weight: 500, weightUnit: 'g' });
    expect(dG.weightInKg).toBeCloseTo(0.5, 2);
  });

  it('should convert dimensions to cm', () => {
    const d = Dimensions.create({ length: 1, width: 2, height: 3, dimensionUnit: 'in' });
    const cm = d.dimensionsInCm;
    expect(cm.length).toBeCloseTo(2.54, 2);
    expect(cm.width).toBeCloseTo(5.08, 2);
  });

  it('should format weight and dimensions', () => {
    const d = Dimensions.create({ weight: 2.5, length: 10, width: 5, dimensionUnit: 'cm' });
    expect(d.formatWeight()).toBe('2.5 kg');
    expect(d.formatDimensions()).toContain('L: 10');
    expect(d.formatDimensions()).toContain('cm');
  });

  it('should format N/A for empty', () => {
    const d = Dimensions.empty();
    expect(d.formatWeight()).toBe('N/A');
    expect(d.formatDimensions()).toBe('N/A');
  });

  it('should serialize to JSON', () => {
    const d = Dimensions.create({ weight: 1, length: 2, width: 3, height: 4 });
    const json = d.toJSON();
    expect(json.weight).toBe(1);
    expect(json.volume).toBe(24);
  });
});
