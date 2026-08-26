import { Brand } from './Brand';

describe('Brand Entity', () => {
  describe('create', () => {
    it('should create a brand with default values', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Acme Shoes' });
      expect(brand.brandId).toBeDefined();
      expect(brand.name).toBe('Acme Shoes');
      expect(brand.slug).toBe('acme-shoes');
      expect(brand.status).toBe('active');
      expect(brand.organizationId).toBe('org-1');
    });

    it('should create a brand with custom values', () => {
      const brand = Brand.create({
        organizationId: 'org-1',
        name: 'Nike',
        slug: 'nike-official',
        description: 'Just do it',
        logoUrl: 'https://example.com/logo.png',
        website: 'https://nike.com',
        countryOfOrigin: 'US',
        externalId: 'shopify-brand-123',
      });
      expect(brand.slug).toBe('nike-official');
      expect(brand.description).toBe('Just do it');
      expect(brand.logoUrl).toBe('https://example.com/logo.png');
      expect(brand.website).toBe('https://nike.com');
      expect(brand.countryOfOrigin).toBe('US');
      expect(brand.externalId).toBe('shopify-brand-123');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const props = {
        brandId: 'brand-1',
        organizationId: 'org-1',
        name: 'Adidas',
        slug: 'adidas',
        status: 'active' as const,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      const brand = Brand.reconstitute(props);
      expect(brand.brandId).toBe('brand-1');
      expect(brand.name).toBe('Adidas');
      expect(brand.status).toBe('active');
    });
  });

  describe('lifecycle', () => {
    it('should activate and deactivate', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Test' });
      brand.deactivate();
      expect(brand.status).toBe('inactive');
      brand.activate();
      expect(brand.status).toBe('active');
    });

    it('should archive', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Test' });
      brand.archive();
      expect(brand.status).toBe('archived');
    });

    it('should not deactivate an archived brand', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Test' });
      brand.archive();
      brand.deactivate();
      expect(brand.status).toBe('archived');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Test' });
      brand.updateProfile({ name: 'Updated', description: 'New desc', website: 'https://test.com' });
      expect(brand.name).toBe('Updated');
      expect(brand.description).toBe('New desc');
      expect(brand.website).toBe('https://test.com');
    });
  });

  describe('externalId', () => {
    it('should set external ID', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Test' });
      brand.setExternalId('woo-brand-456');
      expect(brand.externalId).toBe('woo-brand-456');
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const brand = Brand.create({ organizationId: 'org-1', name: 'Test', externalId: 'ext-1' });
      const json = brand.toJSON();
      expect(json.name).toBe('Test');
      expect(json.externalId).toBe('ext-1');
      expect(json.status).toBe('active');
    });
  });
});
