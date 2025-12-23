/**
 * Product Domain Events
 * Events that occur within the product domain
 */

import { ProductStatus } from '../valueObjects/ProductStatus';
import { ProductVisibility } from '../valueObjects/ProductVisibility';

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

export class ProductCreatedEvent implements DomainEvent {
  readonly eventType = 'product.created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    name: string;
    sku?: string;
    categoryId?: string;
    merchantId?: string;
  };

  constructor(productId: string, name: string, sku?: string, categoryId?: string, merchantId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, name, sku, categoryId, merchantId };
  }
}

export class ProductUpdatedEvent implements DomainEvent {
  readonly eventType = 'product.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    updatedFields: string[];
  };

  constructor(productId: string, updatedFields: string[]) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, updatedFields };
  }
}

export class ProductStatusChangedEvent implements DomainEvent {
  readonly eventType = 'product.status_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    previousStatus: ProductStatus;
    newStatus: ProductStatus;
  };

  constructor(productId: string, previousStatus: ProductStatus, newStatus: ProductStatus) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, previousStatus, newStatus };
  }
}

export class ProductPublishedEvent implements DomainEvent {
  readonly eventType = 'product.published';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    name: string;
    publishedAt: string;
  };

  constructor(productId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, name, publishedAt: this.occurredAt.toISOString() };
  }
}

export class ProductUnpublishedEvent implements DomainEvent {
  readonly eventType = 'product.unpublished';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
  };

  constructor(productId: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId };
  }
}

export class ProductArchivedEvent implements DomainEvent {
  readonly eventType = 'product.archived';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    name: string;
  };

  constructor(productId: string, name: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, name };
  }
}

export class ProductDeletedEvent implements DomainEvent {
  readonly eventType = 'product.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    name: string;
    permanent: boolean;
  };

  constructor(productId: string, name: string, permanent: boolean = false) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, name, permanent };
  }
}

export class ProductPriceChangedEvent implements DomainEvent {
  readonly eventType = 'product.price_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    previousPrice: number;
    newPrice: number;
    currency: string;
  };

  constructor(productId: string, previousPrice: number, newPrice: number, currency: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, previousPrice, newPrice, currency };
  }
}

export class ProductVariantCreatedEvent implements DomainEvent {
  readonly eventType = 'product.variant_created';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    variantId: string;
    sku: string;
    attributes: Record<string, any>[];
  };

  constructor(productId: string, variantId: string, sku: string, attributes: Record<string, any>[]) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, variantId, sku, attributes };
  }
}

export class ProductVariantUpdatedEvent implements DomainEvent {
  readonly eventType = 'product.variant_updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    variantId: string;
    updatedFields: string[];
  };

  constructor(productId: string, variantId: string, updatedFields: string[]) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, variantId, updatedFields };
  }
}

export class ProductVariantDeletedEvent implements DomainEvent {
  readonly eventType = 'product.variant_deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    variantId: string;
    sku: string;
  };

  constructor(productId: string, variantId: string, sku: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, variantId, sku };
  }
}

export class ProductImageAddedEvent implements DomainEvent {
  readonly eventType = 'product.image_added';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    imageId: string;
    url: string;
    isPrimary: boolean;
  };

  constructor(productId: string, imageId: string, url: string, isPrimary: boolean) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, imageId, url, isPrimary };
  }
}

export class ProductCategoryChangedEvent implements DomainEvent {
  readonly eventType = 'product.category_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: {
    productId: string;
    previousCategoryId?: string;
    newCategoryId?: string;
  };

  constructor(productId: string, previousCategoryId?: string, newCategoryId?: string) {
    this.occurredAt = new Date();
    this.aggregateId = productId;
    this.payload = { productId, previousCategoryId, newCategoryId };
  }
}
