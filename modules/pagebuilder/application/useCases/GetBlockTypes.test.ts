import '../../tests/testUtils';
import { GetBlockTypesUseCase } from './GetBlockTypes';
import { registerBuiltInBlocks } from '../../tests/testUtils';

describe('GetBlockTypesUseCase', () => {
  it('should list all registered block types', () => {
    registerBuiltInBlocks();

    expect(new GetBlockTypesUseCase().execute().length).toBeGreaterThan(0);
  });
});
