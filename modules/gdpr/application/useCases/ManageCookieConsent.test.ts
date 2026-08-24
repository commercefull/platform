jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('consent-uuid'),
}));

import { ManageCookieConsentUseCase, RecordCookieConsentCommand, UpdateCookieConsentCommand } from './ManageCookieConsent';
import { GdprValidationError } from '../../domain/errors/GdprErrors';

describe('ManageCookieConsentUseCase', () => {
  let useCase: ManageCookieConsentUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findBySessionId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (c: unknown) => c),
      findById: jest.fn().mockResolvedValue({
        gdprCookieConsentId: 'c1', updatePreferences: jest.fn(),
        getPreferences: () => ({ necessary: true, functional: false, analytics: true, marketing: false }),
        consentedAt: new Date(), expiresAt: undefined,
      }),
    };
    useCase = new ManageCookieConsentUseCase(mockRepo as never);
  });

  it('should record consent for guest (happy path)', async () => {
    const result = await useCase.recordConsent(new RecordCookieConsentCommand(
      'sess1', { necessary: true, functional: true },
    ));

    expect(result.gdprCookieConsentId).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw GdprValidationError when sessionId is empty', async () => {
    await expect(useCase.recordConsent(new RecordCookieConsentCommand('', {}))).rejects.toThrow(GdprValidationError);
  });

  it('should update existing consent', async () => {
    mockRepo.findBySessionId.mockResolvedValue({
      gdprCookieConsentId: 'existing', updatePreferences: jest.fn(),
      getPreferences: () => ({ necessary: true, functional: true, analytics: false, marketing: false }),
      consentedAt: new Date(), expiresAt: undefined,
    });

    const result = await useCase.recordConsent(new RecordCookieConsentCommand(
      'sess1', { functional: true },
    ));

    expect(result.gdprCookieConsentId).toBe('existing');
  });

  it('should update consent by ID', async () => {
    const result = await useCase.updateConsent(new UpdateCookieConsentCommand('c1', { analytics: true }));

    expect(result.gdprCookieConsentId).toBe('c1');
  });
});
