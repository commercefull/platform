/**
 * Unit Tests for SetVatNumber Use Case
 */

import { createCheckoutRepository, createCheckoutSession, createAddress, createTaxQuotePort } from '../../tests/testUtils';
import { SetVatNumberUseCase, SetVatNumberCommand } from './SetVatNumber';
import { SetShippingAddressUseCase } from './SetShippingAddress';
import { CheckoutValidationError } from '../../domain/errors/CheckoutErrors';

describe('SetVatNumberUseCase', () => {
  let useCase: SetVatNumberUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;
  let taxQuote: ReturnType<typeof createTaxQuotePort>;
  let setShippingAddress: { execute: jest.Mock };

  beforeEach(() => {
    checkoutRepository = createCheckoutRepository();
    taxQuote = createTaxQuotePort();
    setShippingAddress = { execute: jest.fn() };
    useCase = new SetVatNumberUseCase(checkoutRepository, setShippingAddress as unknown as SetShippingAddressUseCase, taxQuote);
  });

  it('should store the VAT number and re-quote when a shipping address exists', async () => {
    const session = createCheckoutSession({ shippingAddress: createAddress({ country: 'DE' }) });
    checkoutRepository.findById.mockResolvedValue(session);
    (taxQuote.validateVatNumber as jest.Mock).mockReturnValue(true);
    setShippingAddress.execute.mockResolvedValue({ checkoutId: 'ck-1' });

    const result = await useCase.execute(new SetVatNumberCommand('ck-1', 'DE123456789'));

    expect(session.vatNumber).toBe('DE123456789');
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(setShippingAddress.execute).toHaveBeenCalled();
    expect(result.checkoutId).toBe('ck-1');
  });

  it('should reject an invalid VAT number format', async () => {
    const session = createCheckoutSession();
    checkoutRepository.findById.mockResolvedValue(session);
    (taxQuote.validateVatNumber as jest.Mock).mockReturnValue(false);

    await expect(useCase.execute(new SetVatNumberCommand('ck-1', 'bad-vat'))).rejects.toThrow(CheckoutValidationError);
    expect(session.vatNumber).toBeUndefined();
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });

  it('should clear the VAT number and reverse-charge flag when empty', async () => {
    const session = createCheckoutSession({ vatNumber: 'DE123456789', reverseChargeApplied: true });
    checkoutRepository.findById.mockResolvedValue(session);

    await useCase.execute(new SetVatNumberCommand('ck-1', '  '));

    expect(session.vatNumber).toBeUndefined();
    expect(session.reverseChargeApplied).toBe(false);
    expect(checkoutRepository.save).toHaveBeenCalledWith(session);
    expect(setShippingAddress.execute).not.toHaveBeenCalled();
  });

  it('should save without re-quoting when no shipping address is set', async () => {
    const session = createCheckoutSession();
    checkoutRepository.findById.mockResolvedValue(session);
    (taxQuote.validateVatNumber as jest.Mock).mockReturnValue(true);

    const result = await useCase.execute(new SetVatNumberCommand('ck-1', 'DE123456789'));

    expect(session.vatNumber).toBe('DE123456789');
    expect(setShippingAddress.execute).not.toHaveBeenCalled();
    expect(result.checkoutId).toBe('ck-1');
  });
});
