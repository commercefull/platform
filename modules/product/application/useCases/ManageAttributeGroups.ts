import type {
  AttributeGroupCreateParams,
  AttributeGroupPort,
  AttributeGroupRow,
  AttributeGroupUpdateParams,
} from '../../domain/repositories/ProductCatalogPorts';

export class ManageAttributeGroupsUseCase {
  constructor(private readonly groups: AttributeGroupPort) {}

  async findOne(id: string): Promise<AttributeGroupRow | null> {
    return this.groups.findOne(id);
  }
  async findByCode(code: string): Promise<AttributeGroupRow | null> {
    return this.groups.findByCode(code);
  }
  async findAll(): Promise<AttributeGroupRow[]> {
    return this.groups.findAll();
  }
  async create(props: AttributeGroupCreateParams): Promise<AttributeGroupRow> {
    return this.groups.create(props);
  }
  async update(id: string, props: AttributeGroupUpdateParams): Promise<AttributeGroupRow | null> {
    return this.groups.update(id, props);
  }
  async delete(id: string): Promise<AttributeGroupRow | null> {
    return this.groups.delete(id);
  }
}
