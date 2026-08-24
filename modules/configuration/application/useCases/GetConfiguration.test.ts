import { GetConfigurationUseCase} from './GetConfiguration';

describe('GetConfigurationUseCase', () => {
  let useCase: GetConfigurationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = { findByKey: jest.fn().mockResolvedValue(null) };
    useCase = new GetConfigurationUseCase(mockRepo as never);
  });

  it('should return config at requested scope', async () => {
    mockRepo.findByKey.mockResolvedValue({
      key: 'site.name', value: 'MyStore', scope: 'store', scopeId: 's1', updatedAt: new Date(), updatedBy: 'admin',
    });

    const result = await useCase.execute({ key: 'site.name', scope: 'store', scopeId: 's1' });

    expect(result.found).toBe(true);
    expect(result.configuration?.value).toBe('MyStore');
  });

  it('should inherit from global when not found at store scope', async () => {
    mockRepo.findByKey.mockImplementation((key: string, scope: string) =>
      scope === 'global' ? Promise.resolve({ key, value: 'GlobalName', scope: 'global', updatedAt: new Date() }) : Promise.resolve(null),
    );

    const result = await useCase.execute({ key: 'site.name', scope: 'store', scopeId: 's1' });

    expect(result.found).toBe(true);
    expect(result.inheritedFrom).toBe('global');
    expect(result.configuration?.value).toBe('GlobalName');
  });

  it('should return found=false when not found at any scope', async () => {
    const result = await useCase.execute({ key: 'missing.key' });

    expect(result.found).toBe(false);
  });
});
