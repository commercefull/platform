import { Price } from './Price';
import { ProductValidationError } from '../errors/ProductErrors';

describe('Price', () => {
  it('should create a price with base price only', () => {
    const price = Price.create(100, 'USD');
    expect(price.basePrice).toBe(100);
    expect(price.salePrice).toBeNull();
    expect(price.effectivePrice).toBe(100);
    expect(price.isOnSale).toBe(false);
    expect(price.currency).toBe('USD');
  });

  it('should create a price with sale price', () => {
    const price = Price.create(100, 'USD', 80);
    expect(price.effectivePrice).toBe(80);
    expect(price.isOnSale).toBe(true);
    expect(price.discountAmount).toBe(20);
    expect(price.discountPercentage).toBe(20);
  });

  it('should throw on negative base price', () => {
    expect(() => Price.create(-1)).toThrow(ProductValidationError);
  });

  it('should throw on negative sale price', () => {
    expect(() => Price.create(100, 'USD', -5)).toThrow(ProductValidationError);
  });

  it('should throw when sale price exceeds base price', () => {
    expect(() => Price.create(100, 'USD', 150)).toThrow(ProductValidationError);
  });

  it('should create zero price', () => {
    const price = Price.zero();
    expect(price.basePrice).toBe(0);
    expect(price.effectivePrice).toBe(0);
  });

  it('should calculate profit margin', () => {
    const price = Price.create(100, 'USD', undefined, 60);
    expect(price.profitMargin).toBe(40);
    expect(price.profitMarginPercentage).toBe(40);
  });

  it('should return null profit margin when no cost', () => {
    const price = Price.create(100);
    expect(price.profitMargin).toBeNull();
    expect(price.profitMarginPercentage).toBeNull();
  });

  it('should set sale price', () => {
    const price = Price.create(100);
    const updated = price.setSalePrice(80);
    expect(updated.isOnSale).toBe(true);
    expect(updated.effectivePrice).toBe(80);
  });

  it('should throw when setting sale price above base', () => {
    const price = Price.create(100);
    expect(() => price.setSalePrice(150)).toThrow(ProductValidationError);
  });

  it('should update base price and clear sale if sale exceeds new base', () => {
    const price = Price.create(100, 'USD', 80);
    const updated = price.updateBasePrice(50);
    expect(updated.basePrice).toBe(50);
    expect(updated.salePrice).toBeNull();
  });

  it('should format price', () => {
    const price = Price.create(99.99, 'USD');
    expect(price.format()).toContain('99.99');
  });

  it('should serialize to JSON', () => {
    const price = Price.create(100, 'USD', 80);
    const json = price.toJSON();
    expect(json.basePrice).toBe(100);
    expect(json.salePrice).toBe(80);
    expect(json.isOnSale).toBe(true);
  });
});
