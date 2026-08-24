jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { DuplicateTemplateUseCase, DuplicateTemplateCommand } from './DuplicateTemplate';
import { ContentTemplateNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('DuplicateTemplateUseCase', () => {
  let useCase: DuplicateTemplateUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findTemplateById: jest.fn().mockResolvedValue({
        contentTemplateId: 't1', name: 'Original', slug: 'original', description: 'Original template',
        thumbnail: null, htmlStructure: '<div></div>', cssStyles: null, jsScripts: null,
        areas: null, defaultBlocks: null, compatibleContentTypes: null,
      }),
      createTemplate: jest.fn().mockResolvedValue({ contentTemplateId: 't2', name: 'Copy', slug: 'copy', createdAt: new Date() }),
    };
    useCase = new DuplicateTemplateUseCase(mockRepo as never);
  });

  it('should duplicate a template successfully', async () => {
    const result = await useCase.execute(new DuplicateTemplateCommand('t1', 'Copy', 'copy'));

    expect(result.contentTemplateId).toBe('t2');
    expect(result.originalTemplateId).toBe('t1');
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new DuplicateTemplateCommand('', 'Copy', 'copy'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentTemplateNotFoundError when original does not exist', async () => {
    mockRepo.findTemplateById.mockResolvedValue(null);

    await expect(useCase.execute(new DuplicateTemplateCommand('missing', 'Copy', 'copy'))).rejects.toThrow(ContentTemplateNotFoundError);
  });
});
