import { lazyMock, createPaymentGateway, createPaymentMethodConfig } from '../../tests/testUtils';
import { ManagePaymentGatewaysUseCase } from './ManagePaymentGateways';
import type { PaymentGatewayRepository, PaymentGatewayCreateParams } from '../../domain/repositories/PaymentGatewayRepository';

describe('ManagePaymentGatewaysUseCase', () => {
  let useCase: ManagePaymentGatewaysUseCase;
  let repo: jest.Mocked<PaymentGatewayRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentGatewayRepository>();
    useCase = new ManagePaymentGatewaysUseCase(repo);
  });

  it('should find all gateways', async () => {
    repo.findAllGateways.mockResolvedValue([createPaymentGateway()]);

    const result = await useCase.findAll('org1');

    expect(result).toHaveLength(1);
    expect(repo.findAllGateways).toHaveBeenCalledWith('org1');
  });

  it('should find a gateway by ID', async () => {
    repo.findGatewayById.mockResolvedValue(createPaymentGateway({ paymentGatewayId: 'g1' }));

    const result = await useCase.findById('g1');

    expect(result?.paymentGatewayId).toBe('g1');
  });

  it('should create a gateway', async () => {
    repo.createGateway.mockResolvedValue(createPaymentGateway({ paymentGatewayId: 'g2' }));

    const result = await useCase.create({ organizationId: 'org1', provider: 'stripe' } as unknown as PaymentGatewayCreateParams);

    expect(result.paymentGatewayId).toBe('g2');
  });

  it('should update a gateway', async () => {
    repo.updateGateway.mockResolvedValue(createPaymentGateway({ isActive: false }));

    await useCase.update('g1', { isActive: false });

    expect(repo.updateGateway).toHaveBeenCalledWith('g1', { isActive: false });
  });

  it('should delete a gateway', async () => {
    repo.deleteGateway.mockResolvedValue(true);

    await useCase.delete('g1');

    expect(repo.deleteGateway).toHaveBeenCalledWith('g1');
  });

  it('should find all method configs', async () => {
    repo.findAllMethodConfigs.mockResolvedValue([createPaymentMethodConfig()]);

    const result = await useCase.findAllMethodConfigs('org1');

    expect(result).toHaveLength(1);
    expect(repo.findAllMethodConfigs).toHaveBeenCalledWith('org1');
  });
});
