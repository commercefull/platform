/**
 * Product Use Cases Barrel Export
 *
 * Note: Use direct imports from specific files if there are naming conflicts
 */

// Core product operations
export { CreateProductCommand } from './CreateProduct';
export { UpdateProductCommand } from './UpdateProduct';
export { ListProductsForContextCommand } from './ListProductsForContext';
export { CreateProductVariantCommand } from './CreateProductVariant';

// Query operations - import directly from files if needed
// export * from './GetProduct';
// export * from './ListProducts';
// export * from './SearchProducts';
// export * from './GetProductVariants';

// Attribute sub-module
export * from './attribute';
