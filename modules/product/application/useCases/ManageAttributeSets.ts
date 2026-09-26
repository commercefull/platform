import type { ProductAttributeSetAttribute } from '../../domain/repositories/ProductCatalogPorts';
import { AttributeSetNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

export interface ProductAttributeSetRecord {
  productAttributeSetId?: string;
  name?: string;
  code?: string;
  description?: string;
  productTypeId?: string;
  isActive?: boolean;
  isGlobal?: boolean;
}

export interface AttributeSetCreateInput {
  name?: string;
  code?: string;
  description?: string;
  productTypeId?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  organizationId?: string;
}

interface AttributeSetCreateParams {
  name: string;
  code: string;
  description?: string;
  productTypeId?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  organizationId?: string;
}

export interface AttributeSetUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  productTypeId?: string;
  isActive?: boolean;
}

export interface AttributeSetMappingInput {
  attributeSetId: string;
  attributeId: string;
  position?: number;
  isRequired?: boolean;
  defaultValue?: string;
}

interface AttributeSetPort {
  findAll(): Promise<ProductAttributeSetRecord[]>;
  findById(id: string): Promise<ProductAttributeSetRecord | null>;
  findByCode(code: string): Promise<ProductAttributeSetRecord | null>;
  findByProductType(productTypeId: string): Promise<ProductAttributeSetRecord[]>;
  findByIdWithAttributes(id: string): Promise<ProductAttributeSetRecord | null>;
  getAttributesForProductType(productTypeId: string): Promise<ProductAttributeSetAttribute[]>;
  create(input: AttributeSetCreateParams): Promise<ProductAttributeSetRecord>;
  update(id: string, input: AttributeSetUpdateInput): Promise<ProductAttributeSetRecord | null>;
  delete(id: string): Promise<boolean>;
  addAttribute(input: AttributeSetMappingInput): Promise<void>;
  removeAttribute(attributeSetId: string, attributeId: string): Promise<boolean>;
  reorderAttributes(attributeSetId: string, attributeIds: string[]): Promise<void>;
}

export class ManageAttributeSetsUseCase {
  constructor(private readonly attributeSetRepo: AttributeSetPort) {}

  async list() {
    return this.attributeSetRepo.findAll();
  }

  async findByProductType(productTypeId: string) {
    return this.attributeSetRepo.findByProductType(productTypeId);
  }

  async getAttributesForProductType(productTypeId: string) {
    return this.attributeSetRepo.getAttributesForProductType(productTypeId);
  }

  async getByIdWithAttributes(id: string) {
    const set = await this.attributeSetRepo.findByIdWithAttributes(id);
    if (!set) {
      throw new AttributeSetNotFoundError(id);
    }
    return set;
  }

  async create(input: AttributeSetCreateInput) {
    if (!input.name || !input.code) {
      throw new ProductValidationError('Name and code are required');
    }
    const existing = await this.attributeSetRepo.findByCode(input.code);
    if (existing) {
      throw new ProductValidationError(`Attribute set with code "${input.code}" already exists`);
    }
    return this.attributeSetRepo.create(input as AttributeSetCreateParams);
  }

  async update(id: string, input: AttributeSetUpdateInput) {
    const existing = await this.attributeSetRepo.findById(id);
    if (!existing) {
      throw new AttributeSetNotFoundError(id);
    }
    return this.attributeSetRepo.update(id, input);
  }

  async delete(id: string) {
    const existing = await this.attributeSetRepo.findById(id);
    if (!existing) {
      throw new AttributeSetNotFoundError(id);
    }
    await this.attributeSetRepo.delete(id);
  }

  async addAttribute(attributeSetId: string, input: { attributeId?: string; position?: number; isRequired?: boolean; defaultValue?: string }) {
    if (!input.attributeId) {
      throw new ProductValidationError('attributeId is required');
    }
    await this.attributeSetRepo.addAttribute({ attributeSetId, ...input, attributeId: input.attributeId });
    return this.attributeSetRepo.findByIdWithAttributes(attributeSetId);
  }

  async removeAttribute(attributeSetId: string, attributeId: string) {
    await this.attributeSetRepo.removeAttribute(attributeSetId, attributeId);
  }

  async reorderAttributes(attributeSetId: string, attributeIds: unknown) {
    if (!Array.isArray(attributeIds)) {
      throw new ProductValidationError('attributeIds must be an array');
    }
    await this.attributeSetRepo.reorderAttributes(attributeSetId, attributeIds);
  }
}
