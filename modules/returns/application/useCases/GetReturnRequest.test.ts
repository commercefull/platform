import '../../tests/testUtils';
import { GetReturnRequestUseCase } from './GetReturnRequest';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
import { lazyMock } from '../../tests/testUtils';

describe('GetReturnRequestUseCase', () => {
  it('should throw ReturnNotFoundError when the return does not exist', async () => {
    const repo = lazyMock<ReturnRequestRepository>();
    repo.findById.mockResolvedValue(null);

    await expect(new GetReturnRequestUseCase(repo).execute('missing')).rejects.toThrow(ReturnNotFoundError);
  });
});
