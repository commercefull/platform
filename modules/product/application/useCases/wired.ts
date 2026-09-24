import productRepo from '../../infrastructure/repositories/ProductRepository';
import productTypeRepo from '../../infrastructure/repositories/ProductTypeRepository';
import productVariantRepo from '../../infrastructure/repositories/ProductVariantRepository';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import productQaAnswerRepo from '../../infrastructure/repositories/productQaAnswerRepo';
import productCategoryRepo from '../../infrastructure/repositories/productCategoryRepo';
import productToCategoryRepo from '../../infrastructure/repositories/productToCategoryRepo';
import productTagRepo from '../../infrastructure/repositories/productTagRepo';
import categoryRepo from '../../infrastructure/repositories/categoryRepo';
import productReviewRepo from '../../infrastructure/repositories/productReviewRepo';
import productReviewMediaRepo from '../../infrastructure/repositories/productReviewMediaRepo';
import productReviewVoteRepo from '../../infrastructure/repositories/productReviewVoteRepo';
import productCollectionRepo from '../../infrastructure/repositories/productCollectionRepo';
import productCollectionMapRepo from '../../infrastructure/repositories/productCollectionMapRepo';
import { DynamicAttributeRepository } from '../../infrastructure/repositories/DynamicAttributeRepository';
import { ProductAttributeSetRepository } from '../../infrastructure/repositories/ProductAttributeSetRepository';
import brandRepo from '../../infrastructure/repositories/brandRepo';
import type { DynamicAttributePort } from '../../domain/repositories/ProductCatalogPorts';
import { ProductPricingAdapter } from '../../infrastructure/acl/ProductPricingAdapter';

import { ListProductsUseCase } from './ListProducts';
import { CreateProductUseCase } from './CreateProduct';
import { GetProductUseCase } from './GetProduct';
import { UpdateProductUseCase } from './UpdateProduct';
import { DeleteProductUseCase } from './DeleteProduct';
import { UpdateProductStatusUseCase } from './UpdateProductStatus';
import { ListProductTypesUseCase } from './ListProductTypes';
import { GetProductVariantsUseCase } from './GetProductVariants';
import { CreateProductVariantUseCase } from './CreateProductVariant';
import { ManageProductQaUseCase } from './ManageProductQa';
import { ManageProductCategoriesUseCase } from './ManageProductCategories';
import { ManageProductTagsUseCase } from './ManageProductTags';
import { ManageCategoriesUseCase } from './ManageCategories';
import { ManageProductReviewsUseCase } from './ManageProductReviews';
import { ManageReviewMediaUseCase } from './ManageReviewMedia';
import { GetReviewStatsUseCase } from './GetReviewStats';
import { VoteOnReviewUseCase } from './VoteOnReview';
import { ManageProductCollectionsUseCase } from './ManageProductCollections';
import { ManageProductCollectionUseCase } from './ManageProductCollection';
import { SubmitProductQaUseCase } from './SubmitProductQa';
import { GetProductCatalogEnrichmentUseCase } from './GetProductCatalogEnrichment';
import { GetProductAttributesUseCase } from './GetProductAttributes';
import { SearchProductsUseCase } from './SearchProducts';
import productSearchService from '../services/ProductSearchService';
import { CreateAttributeUseCase } from './attribute/CreateAttribute';
import { UpdateAttributeUseCase } from './attribute/UpdateAttribute';
import { AddAttributeValueUseCase } from './attribute/AddAttributeValue';
import { RemoveAttributeValueUseCase } from './attribute/RemoveAttributeValue';
import { GetAttributeValuesUseCase } from './attribute/GetAttributeValues';
import { SetProductAttributeUseCase } from './attribute/SetProductAttribute';
import { SetProductAttributesUseCase } from './attribute/SetProductAttributes';
import { GetProductAttributesUseCase as GetAssignedProductAttributesUseCase } from './attribute/GetProductAttributes';
import { RemoveProductAttributeUseCase } from './attribute/RemoveProductAttribute';
import { SearchProductsUseCase as AttributeSearchProductsUseCase } from './attribute/SearchProducts';
import { GetSearchSuggestionsUseCase } from './attribute/GetSearchSuggestions';
import { FindSimilarProductsUseCase } from './attribute/FindSimilarProducts';
import { FindByAttributeUseCase } from './attribute/FindByAttribute';

export const dynamicAttributeRepo: DynamicAttributePort = new DynamicAttributeRepository();
const attributeSetRepo = new ProductAttributeSetRepository();

// Pricing is owned by the pricing module — product consumes it through this
// consumer-owned port + ACL adapter (integer cents across the boundary).
export const productPricingPort = new ProductPricingAdapter();

export const listProductsUseCase = new ListProductsUseCase(productRepo, productPricingPort);
export const createProductUseCase = new CreateProductUseCase(productRepo, attributeSetRepo, dynamicAttributeRepo, productPricingPort);
export const getProductUseCase = new GetProductUseCase(productRepo, productPricingPort);
export const updateProductUseCase = new UpdateProductUseCase(productRepo, productPricingPort);
export const deleteProductUseCase = new DeleteProductUseCase(productRepo);
export const updateProductStatusUseCase = new UpdateProductStatusUseCase(productRepo);
export const listProductTypesUseCase = new ListProductTypesUseCase(productTypeRepo);
export const getProductVariantsUseCase = new GetProductVariantsUseCase(productVariantRepo, productPricingPort);
export const createProductVariantUseCase = new CreateProductVariantUseCase(productVariantRepo, productPricingPort);
export const manageProductQaUseCase = new ManageProductQaUseCase(productQaRepo);
export const manageProductCategoriesUseCase = new ManageProductCategoriesUseCase(productCategoryRepo);
export const manageProductTagsUseCase = new ManageProductTagsUseCase(productTagRepo);
export const manageCategoriesUseCase = new ManageCategoriesUseCase(categoryRepo);
export const manageProductReviewsUseCase = new ManageProductReviewsUseCase(productReviewRepo);
export const manageReviewMediaUseCase = new ManageReviewMediaUseCase(productReviewRepo, productReviewMediaRepo);
export const getReviewStatsUseCase = new GetReviewStatsUseCase(productReviewRepo);
export const voteOnReviewUseCase = new VoteOnReviewUseCase(productReviewVoteRepo);
export const manageProductCollectionsUseCase = new ManageProductCollectionsUseCase(productCollectionRepo);
export const manageProductCollectionUseCase = new ManageProductCollectionUseCase(productCollectionRepo, productCollectionMapRepo);
export const submitProductQaUseCase = new SubmitProductQaUseCase(productRepo, productQaRepo);
export const getProductCatalogEnrichmentUseCase = new GetProductCatalogEnrichmentUseCase(
  productRepo,
  productToCategoryRepo,
  productCategoryRepo,
  productTagRepo,
  productQaRepo,
  productQaAnswerRepo,
);
export const getProductAttributesUseCase = new GetProductAttributesUseCase(dynamicAttributeRepo);
export const searchProductsUseCase = new SearchProductsUseCase(productRepo, productPricingPort);
export { brandRepo };

export const createAttributeUseCase = new CreateAttributeUseCase(dynamicAttributeRepo);
export const updateAttributeUseCase = new UpdateAttributeUseCase(dynamicAttributeRepo);
export const addAttributeValueUseCase = new AddAttributeValueUseCase(dynamicAttributeRepo);
export const removeAttributeValueUseCase = new RemoveAttributeValueUseCase(dynamicAttributeRepo);
export const getAttributeValuesUseCase = new GetAttributeValuesUseCase(dynamicAttributeRepo);
export const setProductAttributeUseCase = new SetProductAttributeUseCase(dynamicAttributeRepo);
export const setProductAttributesUseCase = new SetProductAttributesUseCase(dynamicAttributeRepo);
export const getAssignedProductAttributesUseCase = new GetAssignedProductAttributesUseCase(dynamicAttributeRepo);
export const removeProductAttributeUseCase = new RemoveProductAttributeUseCase(dynamicAttributeRepo);
export const attributeSearchProductsUseCase = new AttributeSearchProductsUseCase(productSearchService);
export const getSearchSuggestionsUseCase = new GetSearchSuggestionsUseCase(productSearchService);
export const findSimilarProductsUseCase = new FindSimilarProductsUseCase(productSearchService);
export const findByAttributeUseCase = new FindByAttributeUseCase(productSearchService);
