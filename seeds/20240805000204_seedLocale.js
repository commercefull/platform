/**
 * Seed locales
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('locale').del();
  await knex('locale').insert([
    { code: 'en-US', name: 'English (United States)', language: 'en', countryCode: 'US', isActive: true, isDefault: true, textDirection: 'ltr', dateFormat: 'MM/dd/yyyy', timeFormat: 'h:mm a' },
    { code: 'en-GB', name: 'English (United Kingdom)', language: 'en', countryCode: 'GB', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' },
    { code: 'es-ES', name: 'Spanish (Spain)', language: 'es', countryCode: 'ES', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' },
    { code: 'fr-FR', name: 'French (France)', language: 'fr', countryCode: 'FR', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' },
    { code: 'de-DE', name: 'German (Germany)', language: 'de', countryCode: 'DE', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'dd.MM.yyyy', timeFormat: 'HH:mm' },
    { code: 'it-IT', name: 'Italian (Italy)', language: 'it', countryCode: 'IT', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' },
    { code: 'ja-JP', name: 'Japanese (Japan)', language: 'ja', countryCode: 'JP', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'yyyy/MM/dd', timeFormat: 'HH:mm' },
    { code: 'zh-CN', name: 'Chinese (China)', language: 'zh', countryCode: 'CN', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'yyyy/MM/dd', timeFormat: 'HH:mm' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', language: 'pt', countryCode: 'BR', isActive: true, isDefault: false, textDirection: 'ltr', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' },
    { code: 'ar-AE', name: 'Arabic (UAE)', language: 'ar', countryCode: 'AE', isActive: true, isDefault: false, textDirection: 'rtl', dateFormat: 'dd/MM/yyyy', timeFormat: 'HH:mm' }
  ]);
};
