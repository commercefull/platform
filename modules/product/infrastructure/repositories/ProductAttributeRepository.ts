/**
 * Consolidated Product Attribute Repository
 *
 * Merges attributeRepo, attributeGroupRepo, attributeOptionRepo, productAttributeRepo,
 * productAttributeToGroupRepo, DynamicAttributeRepository, ProductAttributeSetRepository
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Product Attributes (attributes, groups, options, sets, dynamic attributes, values)
 */

import { AttributeRepo } from './attributeRepo';
import { AttributeGroupRepo } from './attributeGroupRepo';
import { AttributeOptionRepo } from './attributeOptionRepo';
import { ProductAttributeRepo } from './productAttributeRepo';
import productAttributeToGroupRepo from './productAttributeToGroupRepo';
import dynamicAttributeRepository from './DynamicAttributeRepository';
import productAttributeSetRepository from './ProductAttributeSetRepository';

// Re-export types for backward compatibility
export type { ProductAttribute } from './attributeRepo';
export type { ProductAttributeGroup } from './attributeGroupRepo';
export type { ProductAttributeOption } from './attributeOptionRepo';
export type { ProductAttributeValue } from './productAttributeRepo';

const attributeRepoInstance = new AttributeRepo();
const attributeGroupRepoInstance = new AttributeGroupRepo();
const attributeOptionRepoInstance = new AttributeOptionRepo();
const productAttributeRepoInstance = new ProductAttributeRepo();

class ProductAttributeRepository {
  readonly attributes = attributeRepoInstance;
  readonly groups = attributeGroupRepoInstance;
  readonly options = attributeOptionRepoInstance;
  readonly values = productAttributeRepoInstance;
  readonly toGroup = productAttributeToGroupRepo;
  readonly dynamic = dynamicAttributeRepository;
  readonly sets = productAttributeSetRepository;
}

export default new ProductAttributeRepository();
