/**
 * Product Infrastructure Repositories
 * Export all repositories for the product feature
 */

// Core Product Repository
export { default as productRepository } from './ProductRepository';

// Product Type Repository
export { ProductTypeRepository, ProductType, ProductTypeCreateInput, ProductTypeUpdateInput } from './ProductTypeRepository';
export { default as productTypeRepository } from './ProductTypeRepository';

// Attribute Set Repository
export {
  ProductAttributeSetRepository,
  ProductAttributeSet,
  ProductAttributeSetWithAttributes,
  ProductAttributeSetAttribute,
  ProductAttributeSetCreateInput,
  ProductAttributeSetUpdateInput,
  AttributeSetMappingInput,
} from './ProductAttributeSetRepository';
export { default as productAttributeSetRepository } from './ProductAttributeSetRepository';

// Dynamic Attribute Repository
export {
  DynamicAttributeRepository,
  ProductAttribute,
  ProductAttributeValue,
  ProductAttributeData,
  AttributeType,
  AttributeInputType,
  ProductAttributeCreateInput,
  ProductAttributeUpdateInput,
  AttributeValueCreateInput,
  SetProductAttributeInput,
} from './DynamicAttributeRepository';
export { default as dynamicAttributeRepository } from './DynamicAttributeRepository';
