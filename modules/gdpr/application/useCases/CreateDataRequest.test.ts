jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('gdpr-uuid'),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateDataRequestUseCase, CreateDataRequestCommand } from './CreateDataRequest';
import { CustomerIdRequiredError, GdprValidationError } from '../../domain/errors/GdprErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateDataRequestUseCase', () => {
  let useCase: CreateDataRequestUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByCustomerId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CreateDataRequestUseCase(mockRepo as never);
  });

  it('should create data request (happy path)', async () => {
    const result = await useCase.execute(new CreateDataRequestCommand('c1', 'access' as never, 'Want my data'));

    expect(result.gdprDataRequestId).toBe('gdpr-uuid');
    expect(result.requestType).toBe('access');
    expect(mockRepo.save).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('gdpr.request.created', expect.objectContaining({ gdprDataRequestId: 'gdpr-uuid' }));
  });

  it('should throw CustomerIdRequiredError when customerId is empty', async () => {
    await expect(useCase.execute(new CreateDataRequestCommand('', 'access' as never))).rejects.toThrow(CustomerIdRequiredError);
  });

  it('should throw GdprValidationError when pending request exists', async () => {
    mockRepo.findByCustomerId.mockResolvedValue([{ requestType: 'access', status: 'pending' }]);

    await expect(useCase.execute(new CreateDataRequestCommand('c1', 'access' as never))).rejects.toThrow(GdprValidationError);
  });
});
