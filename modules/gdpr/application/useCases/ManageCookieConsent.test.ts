import { createConsent, createConsentRepository } from '../../tests/testUtils';
import { ManageCookieConsentUseCase, RecordCookieConsentCommand, UpdateCookieConsentCommand } from './ManageCookieConsent';
import { GdprValidationError } from '../../domain/errors/GdprErrors';

describe('ManageCookieConsentUseCase', () => {
  it('should record anonymous consent when no consent exists for the session', async () => {
    const repository = createConsentRepository(null);

    const result = await new ManageCookieConsentUseCase(repository).recordConsent(
      new RecordCookieConsentCommand('sess-1', { necessary: true, functional: true }),
    );

    expect(result.gdprCookieConsentId).toBe('test-uuid');
    expect(result.preferences.functional).toBe(true);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should record customer consent when a customer id is provided', async () => {
    const repository = createConsentRepository(null);

    const result = await new ManageCookieConsentUseCase(repository).recordConsent(
      new RecordCookieConsentCommand('sess-1', { analytics: true }, 'customer-1'),
    );

    expect(result.gdprCookieConsentId).toBe('test-uuid');
    expect(result.preferences.analytics).toBe(true);
  });

  it('should update the existing consent when the session already has one', async () => {
    const existing = createConsent({ gdprCookieConsentId: 'existing-1', functional: false });
    const repository = createConsentRepository(existing);

    const result = await new ManageCookieConsentUseCase(repository).recordConsent(
      new RecordCookieConsentCommand('sess-1', { functional: true }),
    );

    expect(result.gdprCookieConsentId).toBe('existing-1');
    expect(result.preferences.functional).toBe(true);
  });

  it('should throw GdprValidationError when the session id is blank', async () => {
    const repository = createConsentRepository(null);

    await expect(
      new ManageCookieConsentUseCase(repository).recordConsent(new RecordCookieConsentCommand('  ', {})),
    ).rejects.toThrow(GdprValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should update consent by id when it exists', async () => {
    const repository = createConsentRepository(createConsent({ gdprCookieConsentId: 'c1', analytics: false }));

    const result = await new ManageCookieConsentUseCase(repository).updateConsent(
      new UpdateCookieConsentCommand('c1', { analytics: true }),
    );

    expect(result.gdprCookieConsentId).toBe('c1');
    expect(result.preferences.analytics).toBe(true);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw GdprValidationError when updating a consent that does not exist', async () => {
    const repository = createConsentRepository(null);

    await expect(
      new ManageCookieConsentUseCase(repository).updateConsent(new UpdateCookieConsentCommand('missing', { analytics: true })),
    ).rejects.toThrow(GdprValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should accept all optional cookies when acceptAll is called without existing consent', async () => {
    const repository = createConsentRepository(null);

    const result = await new ManageCookieConsentUseCase(repository).acceptAll('sess-new');

    expect(result.gdprCookieConsentId).toBe('test-uuid');
    expect(result.preferences).toEqual({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      thirdParty: true,
    });
  });

  it('should reject optional cookies when rejectAll is called on an existing consent', async () => {
    const repository = createConsentRepository(createConsent({ functional: true, analytics: true, marketing: true }));

    const result = await new ManageCookieConsentUseCase(repository).rejectAll('sess-1');

    expect(result.preferences).toEqual({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      thirdParty: false,
    });
  });
});
