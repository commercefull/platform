import { ProcessDataRequestUseCase, VerifyIdentityCommand, RejectRequestCommand} from './ProcessDataRequest';
import { DataRequestNotFoundError} from '../../domain/errors/GdprErrors';

describe('ProcessDataRequestUseCase', () => {
  let useCase: ProcessDataRequestUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockGdprService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({
        gdprDataRequestId: 'r1', status: 'pending', requestType: 'access',
        verifyIdentity: jest.fn(), reject: jest.fn(), save: jest.fn(),
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockGdprService = {};
    useCase = new ProcessDataRequestUseCase(mockRepo as never, mockGdprService as never);
  });

  it('should verify identity (happy path)', async () => {
    const result = await useCase.verifyIdentity(new VerifyIdentityCommand('r1', 'email'));

    expect(result.gdprDataRequestId).toBe('r1');
    expect(result.message).toBeDefined();
  });

  it('should throw DataRequestNotFoundError when request not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.verifyIdentity(new VerifyIdentityCommand('missing', 'email'))).rejects.toThrow(DataRequestNotFoundError);
  });

  it('should reject request (happy path)', async () => {
    const result = await useCase.reject(new RejectRequestCommand('r1', 'admin1', 'Invalid request'));

    expect(result.gdprDataRequestId).toBe('r1');
  });

  it('should throw DataRequestNotFoundError when rejecting non-existent request', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.reject(new RejectRequestCommand('missing', 'admin1', 'reason'))).rejects.toThrow(DataRequestNotFoundError);
  });
});
