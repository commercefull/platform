/**
 * CreateLocale Use Case
 */

export interface CreateLocaleInput {
  code: string;
  name: string;
  nativeName?: string;
  direction?: 'ltr' | 'rtl';
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: {
    decimal: string;
    thousands: string;
    precision: number;
  };
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateLocaleOutput {
  localeId: string;
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export class CreateLocaleUseCase {
  constructor(private readonly localizationRepository: any) {}

  async execute(input: CreateLocaleInput): Promise<CreateLocaleOutput> {
    if (!input.code || !input.name) {
      throw new Error('Locale code and name are required');
    }

    // Check for duplicate code
    const existing = await this.localizationRepository.findLocaleByCode(input.code);
    if (existing) {
      throw new Error(`Locale with code '${input.code}' already exists`);
    }

    const localeId = `loc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const locale = await this.localizationRepository.createLocale({
      localeId,
      code: input.code,
      name: input.name,
      nativeName: input.nativeName,
      direction: input.direction || 'ltr',
      dateFormat: input.dateFormat || 'YYYY-MM-DD',
      timeFormat: input.timeFormat || 'HH:mm:ss',
      numberFormat: input.numberFormat || { decimal: '.', thousands: ',', precision: 2 },
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
    });

    return {
      localeId: locale.localeId,
      code: locale.code,
      name: locale.name,
      isDefault: locale.isDefault,
      isActive: locale.isActive,
      createdAt: locale.createdAt.toISOString(),
    };
  }
}
