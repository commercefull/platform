/**
 * Unit Tests for Store Entity
 */

import { Store } from './Store';
import { StoreValidationError } from '../errors/StoreErrors';

describe('Store', () => {
  function createStore(overrides?: Record<string, unknown>): Store {
    return Store.create({
      storeId: 'store-1',
      name: 'Main Store',
      storeType: 'organization_store',
      organizationId: 'org-1',
      ...overrides,
    });
  }

  describe('create', () => {
    it('should create a store with defaults', () => {
      const store = createStore();

      expect(store.storeId).toBe('store-1');
      expect(store.name).toBe('Main Store');
      expect(store.slug).toBe('main-store');
      expect(store.isActive).toBe(true);
      expect(store.isVerified).toBe(false);
      expect(store.isFeatured).toBe(false);
      expect(store.isHeadquarters).toBe(false);
      expect(store.defaultCurrency).toBe('USD');
    });

    it('should generate slug from name', () => {
      const store = createStore({ name: 'My Awesome Store!' });

      expect(store.slug).toBe('my-awesome-store');
    });

    it('should throw when merchant_store has no organizationId', () => {
      expect(() =>
        Store.create({
          storeId: 's-1',
          name: 'Test',
          storeType: 'merchant_store',
        }),
      ).toThrow(StoreValidationError);
    });

    it('should throw when organization_store has no organizationId', () => {
      expect(() =>
        Store.create({
          storeId: 's-1',
          name: 'Test',
          storeType: 'organization_store',
        }),
      ).toThrow(StoreValidationError);
    });

    it('should set default primary and secondary colors', () => {
      const store = createStore();

      expect(store.primaryColor).toBe('#007bff');
      expect(store.secondaryColor).toBe('#6c757d');
    });

    it('should set default settings', () => {
      const store = createStore();

      expect(store.settings?.allowGuestCheckout).toBe(true);
      expect(store.settings?.enableWishlist).toBe(true);
      expect(store.settings?.priceDisplayMode).toBe('exclusive_tax');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const store = Store.reconstitute({
        storeId: 's-1',
        name: 'Test',
        slug: 'test',
        storeType: 'merchant_store',
        organizationId: 'org-1',
        isHeadquarters: true,
        isActive: true,
        isVerified: true,
        isFeatured: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(store.name).toBe('Test');
      expect(store.isHeadquarters).toBe(true);
    });
  });

  describe('computed properties', () => {
    it('isMerchantStore should return true for merchant_store type', () => {
      const store = createStore({ storeType: 'merchant_store' });
      expect(store.isMerchantStore).toBe(true);
      expect(store.isOrganizationStore).toBe(false);
    });

    it('isOrganizationStore should return true for organization_store type', () => {
      const store = createStore({ storeType: 'organization_store' });
      expect(store.isOrganizationStore).toBe(true);
      expect(store.isMerchantStore).toBe(false);
    });
  });

  describe('updateBasicInfo', () => {
    it('should update name and regenerate slug', () => {
      const store = createStore();
      store.updateBasicInfo({ name: 'New Name' });

      expect(store.name).toBe('New Name');
      expect(store.slug).toBe('new-name');
    });

    it('should update description', () => {
      const store = createStore();
      store.updateBasicInfo({ description: 'A great store' });

      expect(store.description).toBe('A great store');
    });
  });

  describe('updateBranding', () => {
    it('should update logo and banner', () => {
      const store = createStore();
      store.updateBranding({ logo: 'logo.png', banner: 'banner.jpg' });

      expect(store.logo).toBe('logo.png');
      expect(store.banner).toBe('banner.jpg');
    });
  });

  describe('updateAddress', () => {
    it('should update address', () => {
      const store = createStore();
      store.updateAddress({
        line1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
      });

      expect(store.address?.city).toBe('Portland');
    });
  });

  describe('status methods', () => {
    it('activate should set isActive to true', () => {
      const store = createStore();
      store.deactivate();
      store.activate();

      expect(store.isActive).toBe(true);
    });

    it('deactivate should set isActive to false', () => {
      const store = createStore();
      store.deactivate();

      expect(store.isActive).toBe(false);
    });

    it('verify should set isVerified to true', () => {
      const store = createStore();
      store.verify();

      expect(store.isVerified).toBe(true);
    });

    it('feature should set isFeatured to true', () => {
      const store = createStore();
      store.feature();

      expect(store.isFeatured).toBe(true);
    });

    it('unfeature should set isFeatured to false', () => {
      const store = createStore();
      store.feature();
      store.unfeature();

      expect(store.isFeatured).toBe(false);
    });
  });

  describe('markAsHeadquarters', () => {
    it('should set isHeadquarters and clear parentStoreId', () => {
      const store = createStore({ parentStoreId: 'parent-1' });
      store.markAsHeadquarters();

      expect(store.isHeadquarters).toBe(true);
      expect(store.parentStoreId).toBeUndefined();
    });
  });

  describe('setParentStore', () => {
    it('should set parentStoreId and clear isHeadquarters', () => {
      const store = createStore();
      store.setParentStore('parent-1');

      expect(store.parentStoreId).toBe('parent-1');
      expect(store.isHeadquarters).toBe(false);
    });
  });

  describe('updateStats', () => {
    it('should update store statistics', () => {
      const store = createStore();
      store.updateStats({ rating: 4.5, reviewCount: 100, productCount: 50 });

      expect(store.storeRating).toBe(4.5);
      expect(store.reviewCount).toBe(100);
      expect(store.productCount).toBe(50);
    });
  });

  describe('generateSlug', () => {
    it('should convert name to slug', () => {
      expect(Store.generateSlug('My Store!')).toBe('my-store');
      expect(Store.generateSlug('  Hello World  ')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(Store.generateSlug('Store @ #1!')).toBe('store-1');
    });

    it('should truncate to 100 chars', () => {
      const longName = 'A'.repeat(150);
      expect(Store.generateSlug(longName).length).toBe(100);
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const store = createStore();
      const json = store.toJSON();

      expect(json.storeId).toBe('store-1');
      expect(json.name).toBe('Main Store');
      expect(json.slug).toBe('main-store');
      expect(json.isActive).toBe(true);
    });
  });
});
