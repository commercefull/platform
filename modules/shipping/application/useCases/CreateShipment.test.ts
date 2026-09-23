import {
  createShippingCarrierPort,
  createShippingMethodPort,
  createShippingCarrier,
  createShippingMethod,
} from '../../tests/testUtils';
import { CreateShipmentUseCase } from './CreateShipment';
import { ShippingCarrierNotFoundError, ShippingMethodNotFoundError } from '../../domain/errors/ShippingErrors';

const baseInput = {
  orderId: 'o1',
  fromAddress: { street1: '123 Main', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
  toAddress: { street1: '456 Oak', city: 'LA', state: 'CA', postalCode: '90001', country: 'US' },
  packages: [{ weight: 2, length: 10, width: 5, height: 3, value: 100 }],
};

describe('CreateShipmentUseCase', () => {
  let useCase: CreateShipmentUseCase;
  let carrierRepo: ReturnType<typeof createShippingCarrierPort>;
  let methodRepo: ReturnType<typeof createShippingMethodPort>;

  beforeEach(() => {
    carrierRepo = createShippingCarrierPort();
    methodRepo = createShippingMethodPort();
    carrierRepo.findByCode.mockResolvedValue(createShippingCarrier({ code: 'ups' }));
    methodRepo.findByCode.mockResolvedValue(createShippingMethod({ code: 'ground', handlingDays: 2 }));
    useCase = new CreateShipmentUseCase(carrierRepo, methodRepo);
  });

  it('should create a shipment with a tracking number and label', async () => {
    const result = await useCase.execute({ ...baseInput, carrierCode: 'ups', serviceCode: 'ground' });

    expect(result.shipmentId).toBe('shipping-uuid-123');
    expect(result.trackingNumber).toContain('UPS');
    expect(result.status).toBe('pending');
    expect(result.labels).toHaveLength(1);
    expect(carrierRepo.findByCode).toHaveBeenCalledWith('ups');
    expect(methodRepo.findByCode).toHaveBeenCalledWith('ground');
  });

  it('should throw ShippingCarrierNotFoundError when the carrier does not exist', async () => {
    carrierRepo.findByCode.mockResolvedValue(null);

    await expect(useCase.execute({ ...baseInput, carrierCode: 'nonexistent', serviceCode: 'ground' })).rejects.toThrow(
      ShippingCarrierNotFoundError,
    );
  });

  it('should throw ShippingMethodNotFoundError when the service code does not exist', async () => {
    methodRepo.findByCode.mockResolvedValue(null);

    await expect(useCase.execute({ ...baseInput, carrierCode: 'ups', serviceCode: 'nonexistent' })).rejects.toThrow(
      ShippingMethodNotFoundError,
    );
  });
});
