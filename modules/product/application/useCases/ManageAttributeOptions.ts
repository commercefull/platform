import type {
  AttributeOptionCreateParams,
  AttributeOptionPort,
  AttributeOptionRow,
  AttributeOptionUpdateParams,
} from '../../domain/repositories/ProductCatalogPorts';

export class ManageAttributeOptionsUseCase {
  constructor(private readonly options: AttributeOptionPort) {}

  async findOne(id: string): Promise<AttributeOptionRow | null> {
    return this.options.findOne(id);
  }
  async findByValue(attributeId: string, value: string): Promise<AttributeOptionRow | null> {
    return this.options.findByValue(attributeId, value);
  }
  async findByAttribute(attributeId: string): Promise<AttributeOptionRow[]> {
    return this.options.findByAttribute(attributeId);
  }
  async create(props: AttributeOptionCreateParams): Promise<AttributeOptionRow> {
    return this.options.create(props);
  }
  async bulkCreate(options: AttributeOptionCreateParams[]): Promise<AttributeOptionRow[]> {
    return this.options.bulkCreate(options);
  }
  async update(id: string, props: AttributeOptionUpdateParams): Promise<AttributeOptionRow | null> {
    return this.options.update(id, props);
  }
  async delete(id: string): Promise<AttributeOptionRow | null> {
    return this.options.delete(id);
  }
  async deleteByAttribute(attributeId: string): Promise<number> {
    return this.options.deleteByAttribute(attributeId);
  }
}
