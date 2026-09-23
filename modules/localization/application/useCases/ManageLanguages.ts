import type { LanguageRepositoryPort } from '../../domain/repositories/LocalizationRepository';

type CreateLanguageParams = Parameters<LanguageRepositoryPort['createLanguage']>[0];
type UpdateLanguageParams = Parameters<LanguageRepositoryPort['updateLanguage']>[1];

export class ManageLanguagesUseCase {
  constructor(private readonly languageRepo: LanguageRepositoryPort) {}

  async listLanguages() {
    return this.languageRepo.listLanguages();
  }
  async findLanguageById(id: string) {
    return this.languageRepo.findLanguageById(id);
  }
  async createLanguage(params: CreateLanguageParams) {
    return this.languageRepo.createLanguage(params);
  }
  async updateLanguage(id: string, updates: UpdateLanguageParams) {
    return this.languageRepo.updateLanguage(id, updates);
  }
  async deleteLanguage(id: string) {
    return this.languageRepo.deleteLanguage(id);
  }
}

