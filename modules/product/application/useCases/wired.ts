import productRepo from '../../infrastructure/repositories/ProductRepository';
import productTypeRepo from '../../infrastructure/repositories/ProductTypeRepository';
import productVariantRepo from '../../infrastructure/repositories/ProductVariantRepository';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import productQaAnswerRepo from '../../infrastructure/repositories/productQaAnswerRepo';
import productPriceRepo from '../../infrastructure/repositories/productPriceRepo';
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
import { ManageProductPricesUseCase } from './ManageProductPrices';
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

const dynamicAttributeRepo = new DynamicAttributeRepository();
const attributeSetRepo = new ProductAttributeSetRepository();

export const listProductsUseCase = new ListProductsUseCase(productRepo);
export const createProductUseCase = new CreateProductUseCase(productRepo, attributeSetRepo, dynamicAttributeRepo);
export const getProductUseCase = new GetProductUseCase(productRepo);
export const updateProductUseCase = new UpdateProductUseCase(productRepo);
export const deleteProductUseCase = new DeleteProductUseCase(productRepo);
export const updateProductStatusUseCase = new UpdateProductStatusUseCase(productRepo);
export const listProductTypesUseCase = new ListProductTypesUseCase(productTypeRepo);
export const getProductVariantsUseCase = new GetProductVariantsUseCase(productVariantRepo);
export const createProductVariantUseCase = new CreateProductVariantUseCase(productVariantRepo);
export const manageProductQaUseCase = new ManageProductQaUseCase(productQaRepo);
export const manageProductPricesUseCase = new ManageProductPricesUseCase(productPriceRepo);
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
export const searchProductsUseCase = new SearchProductsUseCase(productRepo);
