import { createLanguageRepository } from '../../tests/testUtils';
import { ManageLanguagesUseCase } from './ManageLanguages';

describe('ManageLanguagesUseCase', () => {
  it('should list languages when asked', async () => {
    const repository = createLanguageRepository();

    const result = await new ManageLanguagesUseCase(repository).listLanguages();

    expect(result).toHaveLength(1);
    expect(repository.listLanguages).toHaveBeenCalled();
  });

  it('should create the language through the repository', async () => {
    const repository = createLanguageRepository();
    const params = { code: 'en', name: 'English' };

    const result = await new ManageLanguagesUseCase(repository).createLanguage(params);

    expect(result).toBe('lang-2');
    expect(repository.createLanguage).toHaveBeenCalledWith(params);
  });

  it('should update the language when an id is given', async () => {
    const repository = createLanguageRepository();

    await new ManageLanguagesUseCase(repository).updateLanguage('lang-1', { isActive: false });

    expect(repository.updateLanguage).toHaveBeenCalledWith('lang-1', { isActive: false });
  });

  it('should delete the language when an id is given', async () => {
    const repository = createLanguageRepository();

    await new ManageLanguagesUseCase(repository).deleteLanguage('lang-1');

    expect(repository.deleteLanguage).toHaveBeenCalledWith('lang-1');
  });
});

