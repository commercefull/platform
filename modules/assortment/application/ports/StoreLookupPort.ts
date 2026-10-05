/**
 * StoreLookupPort
 *
 * ACL port owned by assortment. Validates that a store exists/is usable
 * before assortment config is attached to it — implemented by an adapter
 * over store's GetStoreUseCase.
 */

export interface StoreLookupPort {
  storeExists(storeId: string): Promise<boolean>;
}
