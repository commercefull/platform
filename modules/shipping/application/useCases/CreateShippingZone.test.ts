jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateShippingZoneUseCase} from './CreateShippingZone';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateShippingZoneUseCase', () => {
  let useCase: CreateShippingZoneUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = { saveZone: jest.fn().mockImplementation(async (zone: unknown) => zone) };
    useCase = new CreateShippingZoneUseCase(mockRepo as never);
  });

  it('should create a shipping zone (happy path)', async () => {
    const result = await useCase.execute({
      name: 'US Zone',
      locations: [{ countryCode: 'US' }],
      isDefault: true,
    });

    expect(result.shippingZone.name).toBe('US Zone');
    expect(result.shippingZone.isDefault).toBe(true);
    expect(eventBus.emit).toHaveBeenCalledWith('shipping.zone_created', expect.objectContaining({ name: 'US Zone' }));
  });

  it('should default isActive to true', async () => {
    const result = await useCase.execute({
      name: 'EU Zone',
      locations: [{ countryCode: 'DE' }],
    });

    expect(result.shippingZone.isActive).toBe(true);
  });
});
