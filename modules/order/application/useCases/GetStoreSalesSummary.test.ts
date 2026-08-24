jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));

import { GetStoreSalesSummaryUseCase } from './GetStoreSalesSummary';

describe('GetStoreSalesSummaryUseCase', () => {
  let useCase: GetStoreSalesSummaryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetStoreSalesSummaryUseCase();
  });

  it('should return empty array when no data', async () => {
    const result = await useCase.execute({
      dateFrom: new Date('2026-01-01'),
      dateTo: new Date('2026-01-31'),
    });

    expect(result).toEqual([]);
  });
});
