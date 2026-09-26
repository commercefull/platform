/**
 * Unit Tests for SetPrimaryCategory Use Case
 */

import { lazyMock, emitMock } from '../../../tests/testUtils';
import { SetPrimaryCategoryUseCase, SetPrimaryCategoryCommand } from './SetPrimaryCategory';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('SetPrimaryCategoryUseCase', () => {
  let useCase: SetPrimaryCategoryUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof SetPrimaryCategoryUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof SetPrimaryCategoryUseCase>[0]>();
    useCase = new SetPrimaryCategoryUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should set the primary categorization and emit the event', async () => {
    mockRepo.setPrimaryCategory.mockResolvedValue({
      contentCategorizationId: 'cg-1',
      contentPageId: 'page-1',
      categoryId: 'cat-1',
      isPrimary: true,
    });

    const result = await useCase.execute(new SetPrimaryCategoryCommand('page-1', 'cg-1'));

    expect(result.isPrimary).toBe(true);
    expect(mockRepo.setPrimaryCategory).toHaveBeenCalledWith('page-1', 'cg-1');
    expect(emitMock).toHaveBeenCalledWith('content.page.primary_category_set', { pageId: 'page-1', categorizationId: 'cg-1' });
  });

  it('should throw ContentValidationError when categorizationId is missing', async () => {
    await expect(useCase.execute(new SetPrimaryCategoryCommand('page-1', ''))).rejects.toThrow(ContentValidationError);
    expect(mockRepo.setPrimaryCategory).not.toHaveBeenCalled();
  });
});
