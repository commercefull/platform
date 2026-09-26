/**
 * ManageSupplierDirectory Use Case
 *
 * Supplier catalog writes: create supplier (name/code validation,
 * currency default), create address (required fields + type default),
 * attach product (required fields + defaults).
 */

import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

export interface SupplierDirectoryPort {
  createSupplier(params: Record<string, unknown>): Promise<unknown>;
  createSupplierAddress(params: Record<string, unknown>): Promise<unknown>;
  createSupplierProduct(params: Record<string, unknown>): Promise<unknown>;
  searchSuppliers(term: string): Promise<unknown[]>;
  findSuppliersWithFilters(filters: Record<string, unknown>, limit: number, offset: number): Promise<unknown[]>;
  findSupplierById(id: string): Promise<unknown>;
  findSupplierByCode(code: string): Promise<unknown>;
  updateSupplier(id: string, params: Record<string, unknown>): Promise<unknown>;
  deleteSupplier(id: string): Promise<boolean>;
  updateSupplierStatus(id: string, status: string): Promise<unknown>;
  approveSupplier(id: string): Promise<unknown>;
  suspendSupplier(id: string): Promise<unknown>;
  getSupplierStatistics(): Promise<unknown>;
  findAddressesBySupplierId(supplierId: string): Promise<unknown[]>;
  updateAddress(id: string, params: Record<string, unknown>): Promise<unknown>;
  deleteAddress(id: string): Promise<boolean>;
  findProductsBySupplierId(supplierId: string): Promise<unknown[]>;
  updateProduct(id: string, params: Record<string, unknown>): Promise<unknown>;
  deleteProduct(id: string): Promise<boolean>;
}

export interface CreateSupplierProfileInput {
  name?: string;
  code?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  isApproved?: boolean;
  status?: string;
  rating?: number;
  taxId?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  currency?: string;
  minOrderValueCents?: number;
  leadTime?: number;
  notes?: string;
  categories?: string[];
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface CreateSupplierAddressInput {
  supplierId: string;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  addressType?: string;
  isDefault?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface AddSupplierProductInput {
  supplierId: string;
  productId?: string;
  productVariantId?: string;
  sku?: string;
  supplierSku?: string;
  supplierProductName?: string;
  isPreferred?: boolean;
  unitCostCents?: number;
  currency?: string;
  minimumOrderQuantity?: number;
  leadTime?: number;
  packagingInfo?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  weight?: number;
  notes?: string;
}

export class ManageSupplierDirectoryUseCase {
  constructor(private readonly suppliers: SupplierDirectoryPort) {}

  async createSupplier(input: CreateSupplierProfileInput): Promise<unknown> {
    const errors: string[] = [];
    if (!input.name) errors.push('name is required');
    if (!input.code) errors.push('code is required');
    if (errors.length > 0) {
      throw new SupplierValidationError(errors.join('; '));
    }

    return this.suppliers.createSupplier({
      name: input.name,
      code: input.code,
      description: input.description,
      website: input.website,
      email: input.email,
      phone: input.phone,
      isActive: input.isActive,
      isApproved: input.isApproved,
      status: input.status,
      rating: input.rating,
      taxId: input.taxId,
      paymentTerms: input.paymentTerms,
      paymentMethod: input.paymentMethod,
      currencyCode: input.currency || 'USD',
      minOrderValueCents: input.minOrderValueCents,
      leadTime: input.leadTime,
      notes: input.notes,
      categories: input.categories,
      tags: input.tags,
      customFields: input.customFields,
    });
  }

  async createAddress(input: CreateSupplierAddressInput): Promise<unknown> {
    if (!input.name || !input.addressLine1 || !input.city || !input.state || !input.postalCode || !input.country) {
      throw new SupplierValidationError('Missing required address fields');
    }

    return this.suppliers.createSupplierAddress({
      supplierId: input.supplierId,
      name: input.name,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      addressType: input.addressType || 'headquarters',
      isDefault: input.isDefault || false,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      notes: input.notes,
      isActive: true,
    });
  }

  async addProduct(input: AddSupplierProductInput): Promise<unknown> {
    if (!input.productId || !input.sku || input.unitCostCents === undefined) {
      throw new SupplierValidationError('Missing required fields: productId, sku, unitCostCents');
    }

    return this.suppliers.createSupplierProduct({
      supplierId: input.supplierId,
      productId: input.productId,
      productVariantId: input.productVariantId,
      sku: input.sku,
      supplierSku: input.supplierSku,
      supplierProductName: input.supplierProductName,
      status: 'active',
      isPreferred: input.isPreferred || false,
      unitCostCents: input.unitCostCents,
      currencyCode: input.currency || 'USD',
      minimumOrderQuantity: input.minimumOrderQuantity || 1,
      leadTime: input.leadTime,
      packagingInfo: input.packagingInfo,
      dimensions: input.dimensions,
      weight: input.weight,
      notes: input.notes,
    });
  }

  async listSuppliers(query: {
    search?: string;
    filters: Record<string, unknown>;
    limit: number;
    offset: number;
  }): Promise<unknown[]> {
    if (query.search) {
      return this.suppliers.searchSuppliers(query.search);
    }
    return this.suppliers.findSuppliersWithFilters(query.filters, query.limit, query.offset);
  }

  async getSupplierById(id: string): Promise<unknown> {
    return this.suppliers.findSupplierById(id);
  }

  async getSupplierByCode(code: string): Promise<unknown> {
    return this.suppliers.findSupplierByCode(code);
  }

  async updateSupplier(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.suppliers.updateSupplier(id, params);
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.deleteSupplier(id);
  }

  async updateSupplierStatus(id: string, status?: string): Promise<unknown> {
    if (!status) {
      throw new SupplierValidationError('status is required');
    }
    return this.suppliers.updateSupplierStatus(id, status);
  }

  async setSupplierVisibility(id: string, isVisible?: boolean): Promise<unknown> {
    if (isVisible === undefined) {
      throw new SupplierValidationError('isVisible is required');
    }
    return this.suppliers.updateSupplier(id, { isActive: isVisible });
  }

  async approveSupplier(id: string): Promise<unknown> {
    return this.suppliers.approveSupplier(id);
  }

  async suspendSupplier(id: string): Promise<unknown> {
    return this.suppliers.suspendSupplier(id);
  }

  async getStatistics(): Promise<unknown> {
    return this.suppliers.getSupplierStatistics();
  }

  async listAddresses(supplierId: string): Promise<unknown[]> {
    return this.suppliers.findAddressesBySupplierId(supplierId);
  }

  async updateAddress(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.suppliers.updateAddress(id, params);
  }

  async deleteAddress(id: string): Promise<boolean> {
    return this.suppliers.deleteAddress(id);
  }

  async listProducts(supplierId: string): Promise<unknown[]> {
    return this.suppliers.findProductsBySupplierId(supplierId);
  }

  async updateProduct(id: string, params: Record<string, unknown>): Promise<unknown> {
    return this.suppliers.updateProduct(id, params);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.suppliers.deleteProduct(id);
  }
}
