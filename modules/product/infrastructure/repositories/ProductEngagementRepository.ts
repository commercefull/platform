/**
 * Consolidated Product Engagement Repository
 *
 * Merges productReviewRepo, productReviewMediaRepo, productReviewVoteRepo,
 * productQaRepo, productQaAnswerRepo, productQaVoteRepo,
 * productMediaRepo, productImageRepo, productRelationshipRepo,
 * bundleRepo, productCollectionRepo, productCollectionMapRepo,
 * productListRepo, productListItemRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Product Engagement (reviews, Q&A, media, images, relationships, bundles, collections, lists)
 */

import { ProductReviewRepo } from './productReviewRepo';
import productReviewMediaRepo from './productReviewMediaRepo';
import productReviewVoteRepo from './productReviewVoteRepo';
import productQaRepo from './productQaRepo';
import productMediaRepo from './productMediaRepo';
import productImageRepo from './productImageRepo';
import productRelationshipRepo from './productRelationshipRepo';
import * as bundleRepo from './bundleRepo';
import productCollectionRepo from './productCollectionRepo';
import productCollectionMapRepo from './productCollectionMapRepo';

// Re-export types for backward compatibility
export type { ProductReview, ReviewFilters, ReviewRating } from './productReviewRepo';
export type { ProductReviewMedia } from './productReviewMediaRepo';
export type { ProductQa, ProductQaStatus } from './productQaRepo';
export type { RelationType } from './productRelationshipRepo';
export type { ProductCollection, ProductCollectionCreateParams, ProductCollectionUpdateParams } from './productCollectionRepo';
export type { ProductCollectionMap } from './productCollectionMapRepo';

const productReviewRepoInstance = new ProductReviewRepo();

class ProductEngagementRepository {
  readonly reviews = productReviewRepoInstance;
  readonly reviewMedia = productReviewMediaRepo;
  readonly reviewVotes = productReviewVoteRepo;
  readonly qa = productQaRepo;
  readonly media = productMediaRepo;
  readonly images = productImageRepo;
  readonly relationships = productRelationshipRepo;
  readonly bundles = bundleRepo;
  readonly collections = productCollectionRepo;
  readonly collectionMaps = productCollectionMapRepo;
}

export default new ProductEngagementRepository();
