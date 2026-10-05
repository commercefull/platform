// Domain entities (single source of truth)
export * from './domain/entities/Collection';
export * from './domain/entities/CollectionMap';
export * from './domain/entities/StoreAssortment';
export * from './domain/entities/StoreAssortmentEntry';

// Domain errors
export * from './domain/errors/AssortmentErrors';

// Domain repository ports
export * from './domain/repositories/AssortmentRepository';

// Domain services
export * from './domain/services/CollectionRuleEvaluator';

// Application ports + use cases
export * from './application/ports/CatalogQueryPort';
export * from './application/ports/StoreLookupPort';
export * from './application/useCases';

// Interface (routers + controllers)
export { assortmentBusinessRouter } from './interface/routers/assortmentBusinessRouter';
export { assortmentCustomerRouter } from './interface/routers/assortmentCustomerRouter';
export * as adminCollectionController from './interface/controllers/adminCollectionController';
export * as adminStoreAssortmentController from './interface/controllers/adminStoreAssortmentController';
export { listCollectionsPage, getCollectionPage } from './interface/controllers/storefrontCollectionController';
