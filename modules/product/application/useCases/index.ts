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

// Catalog enrichment use cases
export { SubmitProductQaCommand, SubmitProductQaUseCase } from './SubmitProductQa';
export type { SubmitProductQaResponse } from './SubmitProductQa';

export { VoteOnReviewCommand, VoteOnReviewUseCase } from './VoteOnReview';
export type { VoteOnReviewResponse } from './VoteOnReview';

export { ManageProductCollectionCommand, ManageProductCollectionUseCase } from './ManageProductCollection';
export type { ManageProductCollectionResponse, CollectionMapItem } from './ManageProductCollection';

export { GetProductCatalogEnrichmentCommand, GetProductCatalogEnrichmentUseCase } from './GetProductCatalogEnrichment';
export type { ProductCatalogEnrichmentResponse, QaWithAnswers } from './GetProductCatalogEnrichment';

// Attribute sub-module
export * from './attribute';
