/**
 * CatalogVariantPort — port over the record-style productVariant store.
 *
 * Distinct from `ProductVariantPort` (domain/repositories/ProductCatalogPorts.ts),
 * which models the attributes-based variant aggregate. The storefront/admin
 * "options" variant rows are managed through this port; the concrete
 * implementation is `productVariantRepo` (ProductCatalogRepository.variants).
 */

export interface CatalogVariantOption {
  name: string;
  value: string;
}

export interface CatalogVariantRecord {
  id: string;
  productId: string;
  sku: string;
  name: string;
  barcode?: string;
  inventory: number;
  inventoryPolicy: string;
  weight?: number | null;
  weightUnit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string | null;
  isDefault: boolean;
  position: number;
  options: CatalogVariantOption[];
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CatalogVariantCreateParams {
  productId: string;
  sku: string;
  name: string;
  inventory: number;
  inventoryPolicy: string;
  isDefault: boolean;
  position: number;
  options: CatalogVariantOption[];
  isActive: boolean;
  barcode?: string;
  weight?: number | null;
  weightUnit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string | null;
}

export type CatalogVariantUpdateParams = Partial<Omit<CatalogVariantCreateParams, 'productId'>>;

export interface CatalogVariantWritePort {
  findById(id: string): Promise<CatalogVariantRecord | null>;
  findByProductId(productId: string): Promise<CatalogVariantRecord[]>;
  create(params: CatalogVariantCreateParams): Promise<CatalogVariantRecord>;
  update(id: string, params: CatalogVariantUpdateParams): Promise<CatalogVariantRecord>;
  delete(id: string): Promise<boolean>;
}
