jest.mock('../../infrastructure/repositories/PaymentDataRepository', () => ({
  __esModule: true,
  default: {
    gateways: {
      findAllGateways: jest.fn().mockResolvedValue([{ gatewayId: 'g1' }]),
      findGatewayById: jest.fn().mockResolvedValue({ gatewayId: 'g1' }),
      createGateway: jest.fn().mockResolvedValue({ gatewayId: 'g2' }),
      updateGateway: jest.fn().mockResolvedValue(undefined),
      deleteGateway: jest.fn().mockResolvedValue(undefined),
      findAllMethodConfigs: jest.fn().mockResolvedValue([{ configId: 'c1' }]),
    },
  },
}));

import { ManagePaymentGatewaysUseCase } from './ManagePaymentGateways';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const mockRepo = paymentDataRepository as unknown as { gateways: Record<string, jest.Mock> };

describe('ManagePaymentGatewaysUseCase', () => {
  let useCase: ManagePaymentGatewaysUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManagePaymentGatewaysUseCase();
  });

  it('should find all gateways', async () => {
    const result = await useCase.findAll('org1');
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('g1');
    expect(result).toEqual({ gatewayId: 'g1' });
  });

  it('should create gateway', async () => {
    const result = await useCase.create({ organizationId: 'org1', provider: 'stripe' } as never);
    expect(result).toEqual({ gatewayId: 'g2' });
  });

  it('should update gateway', async () => {
    await useCase.update('g1', { isActive: false });
    expect(mockRepo.gateways.updateGateway).toHaveBeenCalledWith('g1', { isActive: false });
  });

  it('should delete gateway', async () => {
    await useCase.delete('g1');
    expect(mockRepo.gateways.deleteGateway).toHaveBeenCalledWith('g1');
  });

  it('should find all method configs', async () => {
    const result = await useCase.findAllMethodConfigs('org1');
    expect(result).toHaveLength(1);
  });
});
