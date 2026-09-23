import { blockSchemaRegistry } from '../../domain/services/BlockSchemaRegistry';

export class GetBlockTypesUseCase {
  execute() {
    return blockSchemaRegistry.list();
  }

  executeByCategory(category: string) {
    return blockSchemaRegistry.listByCategory(category as 'layout' | 'content' | 'media' | 'commerce' | 'advanced');
  }

  executeByRegion(region: string) {
    return blockSchemaRegistry.listByRegion(region);
  }
}
