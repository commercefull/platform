/**
 * Wired Use Cases — Assortment Module
 *
 * Composition root for assortment use cases. Injects repository
 * implementations and cross-module ACL ports.
 */

import collectionRepo from '../../infrastructure/repositories/CollectionRepositoryImpl';
import collectionMapRepo from '../../infrastructure/repositories/CollectionMapRepositoryImpl';
import assortmentStoreRepo from '../../infrastructure/repositories/StoreAssortmentRepositoryImpl';
import { getAssortmentPorts } from '../../infrastructure/compositionRoot';

import { ManageCollectionsUseCase } from './ManageCollections';
import { ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';
import { ManageStoreAssortmentUseCase } from './ManageStoreAssortment';
import { ResolveStoreCatalogUseCase } from './ResolveStoreCatalog';
import { CheckStoreSellabilityUseCase } from './CheckStoreSellability';
import { BrowseCollectionsUseCase } from './BrowseCollections';

const ports = getAssortmentPorts();

export const manageCollectionsUseCase = new ManageCollectionsUseCase(collectionRepo, collectionMapRepo);

export const resolveCollectionProductsUseCase = new ResolveCollectionProductsUseCase(collectionRepo, collectionMapRepo, ports.catalogQuery);

export const manageStoreAssortmentUseCase = new ManageStoreAssortmentUseCase(assortmentStoreRepo, ports.storeLookup);

export const resolveStoreCatalogUseCase = new ResolveStoreCatalogUseCase(
  assortmentStoreRepo,
  resolveCollectionProductsUseCase,
  ports.catalogQuery,
  ports.storeLookup,
);

export const checkStoreSellabilityUseCase = new CheckStoreSellabilityUseCase(
  assortmentStoreRepo,
  resolveCollectionProductsUseCase,
  ports.catalogQuery,
);

export const browseCollectionsUseCase = new BrowseCollectionsUseCase(collectionRepo, resolveCollectionProductsUseCase);
