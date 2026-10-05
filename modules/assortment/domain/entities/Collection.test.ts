import { Collection } from './Collection';
import { createCollection } from '../../tests/testUtils';

describe('Collection', () => {
  it('should default to active, non-automated, manual sort when created', () => {
    const collection = createCollection();
    expect(collection.isActive).toBe(true);
    expect(collection.isAutomated).toBe(false);
    expect(collection.isFeatured).toBe(false);
    expect(collection.sortOrder).toBe('manual');
  });

  it('should be published when active without publish window', () => {
    expect(createCollection().isPublished()).toBe(true);
  });

  it('should not be published when inactive', () => {
    expect(createCollection({ isActive: false }).isPublished()).toBe(false);
  });

  it('should not be published before publishAt', () => {
    const collection = createCollection({ publishAt: new Date(Date.now() + 60_000) });
    expect(collection.isPublished()).toBe(false);
  });

  it('should be published when publishAt is in the past', () => {
    const collection = createCollection({ publishAt: new Date(Date.now() - 60_000) });
    expect(collection.isPublished()).toBe(true);
  });

  it('should not be published after unpublishAt', () => {
    const collection = createCollection({ unpublishAt: new Date(Date.now() - 60_000) });
    expect(collection.isPublished()).toBe(false);
  });

  it('should not be published when soft-deleted', () => {
    const collection = Collection.reconstitute({
      ...createCollection().toJSON(),
      deletedAt: new Date(),
    } as Parameters<typeof Collection.reconstitute>[0]);
    expect(collection.isPublished()).toBe(false);
  });

  it('should update fields and clear nullable values when updated with null', () => {
    const collection = createCollection({ description: 'old', bannerUrl: 'https://x/b.png' });
    collection.update({ name: 'New Name', description: null, bannerUrl: null });
    expect(collection.name).toBe('New Name');
    expect(collection.description).toBeUndefined();
    expect(collection.bannerUrl).toBeUndefined();
  });
});
