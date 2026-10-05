/**
 * Composition Root — Assortment Module
 *
 * Wires ACL adapter implementations to application ports.
 * This is the ONLY place that knows about provider modules'
 * concrete use cases and repositories.
 */

import { listProductsUseCase } from '../../product/application/useCases/wired';
import productRepo from '../../product/infrastructure/repositories/ProductRepository';
import { getStoreUseCase } from '../../store/application/useCases/wired';

import type { CatalogQueryPort } from '../application/ports/CatalogQueryPort';
import type { StoreLookupPort } from '../application/ports/StoreLookupPort';
import { ProductCatalogAdapter } from './acl/ProductCatalogAdapter';
import { StoreLookupAdapter } from './acl/StoreLookupAdapter';

export interface AssortmentPorts {
  catalogQuery: CatalogQueryPort;
  storeLookup: StoreLookupPort;
}

let ports: AssortmentPorts | null = null;

export function getAssortmentPorts(): AssortmentPorts {
  ports ??= {
    catalogQuery: new ProductCatalogAdapter(listProductsUseCase, productRepo),
    storeLookup: new StoreLookupAdapter(getStoreUseCase),
  };
  return ports;
}
