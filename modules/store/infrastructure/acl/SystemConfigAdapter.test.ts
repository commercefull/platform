import { SystemConfigAdapter } from './SystemConfigAdapter';
import { SystemConfigurationRepository } from '../../../configuration/domain/repositories/SystemConfigurationRepository';
import { SystemConfiguration } from '../../../configuration/domain/entities/SystemConfiguration';

describe('SystemConfigAdapter (store)', () => {
  let adapter: SystemConfigAdapter;
  let mockConfigRepo: jest.Mocked<Pick<SystemConfigurationRepository, 'findActive'>>;

  beforeEach(() => {
    mockConfigRepo = {
      findActive: jest.fn(),
    };
    adapter = new SystemConfigAdapter(mockConfigRepo as never as SystemConfigurationRepository);
  });

  it('should return SystemConfigSummary when config exists', async () => {
    const mockConfig = {
      isMarketplace: false,
      isMultiStore: true,
      isSingleStore: false,
    } as SystemConfiguration;
    mockConfigRepo.findActive.mockResolvedValue(mockConfig);

    const result = await adapter.findActive();

    expect(result).toEqual({ isMarketplace: false, isMultiStore: true, isSingleStore: false });
  });

  it('should return null when no active config exists', async () => {
    mockConfigRepo.findActive.mockResolvedValue(null);

    const result = await adapter.findActive();

    expect(result).toBeNull();
  });
});
