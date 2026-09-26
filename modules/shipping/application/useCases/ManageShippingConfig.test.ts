import { lazyMock, createShippingCarrier } from '../../tests/testUtils';
import type { ShippingCarrierPort, ShippingPackagingPort } from '../../domain/repositories/ShippingConfigPorts';
import type { ShippingSurchargeAdminPort } from '../../domain/repositories/ShippingSurchargePort';
import { ShippingValidationError } from '../../domain/errors/ShippingErrors';
import { ManageShippingConfigurationUseCase } from './ManageShippingConfig';

describe('ManageShippingConfigurationUseCase', () => {
  let carriers: jest.Mocked<ShippingCarrierPort>;
  let packaging: jest.Mocked<ShippingPackagingPort>;
  let surcharges: jest.Mocked<ShippingSurchargeAdminPort>;
  let useCase: ManageShippingConfigurationUseCase;

  beforeEach(() => {
    carriers = lazyMock<ShippingCarrierPort>();
    packaging = lazyMock<ShippingPackagingPort>();
    surcharges = lazyMock<ShippingSurchargeAdminPort>();
    useCase = new ManageShippingConfigurationUseCase(carriers, packaging, surcharges);
  });

  it('should list active carriers when requested', async () => {
    carriers.findAll.mockResolvedValue([createShippingCarrier()]);

    const result = await useCase.listCarriers(true);

    expect(result).toHaveLength(1);
    expect(carriers.findAll).toHaveBeenCalledWith(true);
  });

  it('should create a carrier', async () => {
    carriers.create.mockResolvedValue(createShippingCarrier({ code: 'UPS' }));
    const { shippingCarrierId: _id, createdAt: _c, updatedAt: _u, ...input } = createShippingCarrier({ code: 'UPS' });

    const result = await useCase.createCarrier(input);

    expect(result.code).toBe('UPS');
    expect(carriers.create).toHaveBeenCalledWith(input);
  });

  it('should delete a packaging type', async () => {
    packaging.delete.mockResolvedValue(true);

    const result = await useCase.deletePackagingType('p1');

    expect(result).toBe(true);
    expect(packaging.delete).toHaveBeenCalledWith('p1');
  });

  it('should list surcharges by rate', async () => {
    surcharges.findByRateId.mockResolvedValue([]);

    await useCase.listSurchargesByRate('rate-1', false);

    expect(surcharges.findByRateId).toHaveBeenCalledWith('rate-1', false);
  });

  it('should reject a surcharge missing required fields', async () => {
    await expect(
      useCase.createSurcharge({ shippingRateId: 'r1', type: 'fuel', calculationType: '', value: '5', conditions: null, isActive: true }),
    ).rejects.toBeInstanceOf(ShippingValidationError);
    expect(surcharges.create).not.toHaveBeenCalled();
  });

  it('should create a valid surcharge', async () => {
    surcharges.create.mockResolvedValue({
      shippingSurchargeId: 's1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      shippingRateId: 'r1',
      type: 'fuel',
      calculationType: 'flat',
      value: '5',
      conditions: null,
      isActive: true,
    });
    const input = { shippingRateId: 'r1', type: 'fuel', calculationType: 'flat', value: '5', conditions: null, isActive: true };

    const result = await useCase.createSurcharge(input);

    expect(result.shippingSurchargeId).toBe('s1');
    expect(surcharges.create).toHaveBeenCalledWith(input);
  });
});
