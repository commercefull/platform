/**
 * Supplier Repository Port
 *
 * Domain interface for supplier data access (suppliers, addresses, products).
 */

import type { Supplier, SupplierStatus } from '../entities/Supplier';

export type SupplierAddressType = 'headquarters' | 'billing' | 'warehouse' | 'returns' | 'manufacturing';
export type SupplierProductStatus = 'active' | 'inactive' | 'discontinued' | 'pending';

export interface SupplierAddress {
  supplierAddressId: string;
  createdAt: string;
  updatedAt: string;
  supplierId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: SupplierAddressType;
  isDefault: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isActive: boolean;
}

export interface SupplierProduct {
  supplierProductId: string;
  createdAt: string;
  updatedAt: string;
  supplierId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  supplierSku?: string;
  supplierProductName?: string;
  status: SupplierProductStatus;
  isPreferred: boolean;
  unitCost: number;
  currency: string;
  minimumOrderQuantity: number;
  leadTime?: number;
  packagingInfo?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  weight?: number;
  lastOrderedAt?: string;
  notes?: string;
}

export interface SupplierFilters {
  status?: SupplierStatus;
  isActive?: boolean;
  isApproved?: boolean;
  minRating?: number;
  category?: string;
  tag?: string;
  currency?: string;
}

export type SupplierCreateParams = Omit<Supplier, 'supplierId' | 'createdAt' | 'updatedAt'>;
export type SupplierUpdateParams = Partial<Omit<Supplier, 'supplierId' | 'code' | 'createdAt' | 'updatedAt'>>;
export type SupplierAddressCreateParams = Omit<SupplierAddress, 'supplierAddressId' | 'createdAt' | 'updatedAt'>;
export type SupplierAddressUpdateParams = Partial<Omit<SupplierAddress, 'supplierAddressId' | 'supplierId' | 'createdAt' | 'updatedAt'>>;
export type SupplierProductCreateParams = Omit<SupplierProduct, 'supplierProductId' | 'createdAt' | 'updatedAt'>;
export type SupplierProductUpdateParams = Partial<Omit<SupplierProduct, 'supplierProductId' | 'supplierId' | 'productId' | 'createdAt' | 'updatedAt'>>;

export interface SupplierRepository {
  // Suppliers
  findById(supplierId: string): Promise<Supplier | null>;
  findByCode(code: string): Promise<Supplier | null>;
  findAll(filters?: SupplierFilters): Promise<Supplier[]>;
  create(params: SupplierCreateParams): Promise<Supplier>;
  update(supplierId: string, params: SupplierUpdateParams): Promise<Supplier | null>;
  delete(supplierId: string): Promise<boolean>;
  updateStatus(supplierId: string, status: SupplierStatus): Promise<Supplier | null>;
  setVisibility(supplierId: string, isActive: boolean): Promise<Supplier | null>;
  approve(supplierId: string): Promise<Supplier | null>;
  suspend(supplierId: string): Promise<Supplier | null>;
  getStatistics(): Promise<Record<string, unknown>>;

  // Addresses
  findAddressById(id: string): Promise<SupplierAddress | null>;
  findAddressesBySupplierId(supplierId: string, activeOnly?: boolean): Promise<SupplierAddress[]>;
  createAddress(params: SupplierAddressCreateParams): Promise<SupplierAddress>;
  updateAddress(id: string, params: SupplierAddressUpdateParams): Promise<SupplierAddress | null>;
  deleteAddress(id: string): Promise<boolean>;

  // Products
  findProductById(id: string): Promise<SupplierProduct | null>;
  findProductsBySupplierId(supplierId: string, activeOnly?: boolean): Promise<SupplierProduct[]>;
  findProductsByProductId(productId: string): Promise<SupplierProduct[]>;
  createProduct(params: SupplierProductCreateParams): Promise<SupplierProduct>;
  updateProduct(id: string, params: SupplierProductUpdateParams): Promise<SupplierProduct | null>;
  deleteProduct(id: string): Promise<boolean>;
}
