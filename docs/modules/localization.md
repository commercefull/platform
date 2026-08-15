# Localization Feature

## Overview

The Localization feature manages multi-language support and regional settings. It enables content translation, locale-specific formatting, and internationalization of the storefront.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-LOC-001 | List Languages | Merchant/Admin | List all configured languages with their codes and status |
| UC-LOC-002 | Create Language | Merchant/Admin | Add a new language (ISO 639-1 code) to enable content translation |
| UC-LOC-003 | Update Language | Merchant/Admin | Update an existing language's name, native name, or default/active status |
| UC-LOC-004 | Delete Language | Merchant/Admin | Permanently remove a language and its translations |
| UC-LOC-005 | List Translations | Merchant/Admin | List translation keys and values with optional language/namespace/search filtering |
| UC-LOC-006 | Get Translation | Merchant/Admin | Retrieve a specific translation key's value for a given language |
| UC-LOC-007 | Create/Update Translation | Merchant/Admin | Create or update a translation value for a specific key and language |
| UC-LOC-008 | Delete Translation | Merchant/Admin | Remove a translation key's value for a given language |
| UC-LOC-009 | Import Translations | Merchant/Admin | Bulk import translations from JSON or CSV data for a language |
| UC-LOC-010 | Export Translations | Merchant/Admin | Export all translations for a language in JSON or CSV format |
| UC-LOC-011 | List Locales | Merchant/Admin | List all configured locale settings (date/time/number formats) |
| UC-LOC-012 | Create Locale | Merchant/Admin | Create a locale with regional formatting (currency, date, time, number formats) |
| UC-LOC-013 | Update Locale | Merchant/Admin | Update an existing locale's formatting or active status |
| UC-LOC-014 | Delete Locale | Merchant/Admin | Permanently remove a locale configuration |
| UC-LOC-015 | Get Available Languages | Customer/Guest | Retrieve the list of active storefront languages |
| UC-LOC-016 | Get Translations | Customer/Guest | Retrieve all translations for a specific language with optional namespace filter |
| UC-LOC-017 | Detect Locale | Customer/Guest | Auto-detect the appropriate locale from browser headers or IP address |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-LOC-001 | GET | `/business/localization/languages` |
| UC-LOC-002 | POST | `/business/localization/languages` |
| UC-LOC-003 | PUT | `/business/localization/languages/:code` |
| UC-LOC-004 | DELETE | `/business/localization/languages/:code` |
| UC-LOC-005 | GET | `/business/localization/translations` |
| UC-LOC-006 | GET | `/business/localization/translations/:key` |
| UC-LOC-007 | PUT | `/business/localization/translations/:key` |
| UC-LOC-008 | DELETE | `/business/localization/translations/:key` |
| UC-LOC-009 | POST | `/business/localization/translations/import` |
| UC-LOC-010 | GET | `/business/localization/translations/export` |
| UC-LOC-011 | GET | `/business/localization/locales` |
| UC-LOC-012 | POST | `/business/localization/locales` |
| UC-LOC-013 | PUT | `/business/localization/locales/:code` |
| UC-LOC-014 | DELETE | `/business/localization/locales/:code` |
| UC-LOC-015 | GET | `/localization/languages` |
| UC-LOC-016 | GET | `/localization/translations/:languageCode` |
| UC-LOC-017 | GET | `/localization/detect` |

---

## Events Emitted

| Event                                | Trigger             | Payload             |
| ------------------------------------ | ------------------- | ------------------- |
| `localization.language.added`        | Language added      | languageCode        |
| `localization.translation.updated`   | Translation updated | key, languageCode   |
| `localization.translations.imported` | Bulk import         | languageCode, count |

---

## Integration Test Coverage

| Use Case                 | Test File                       | Status |
| ------------------------ | ------------------------------- | ------ |
| UC-LOC-001 to UC-LOC-004 | `localization/localization.test.ts` | ✅ |
| UC-LOC-005 to UC-LOC-010 | `localization/localization.test.ts` | ✅ |
| UC-LOC-011 to UC-LOC-014 | `localization/localization.test.ts` | ✅ |
| UC-LOC-015 to UC-LOC-017 | `localization/localization.test.ts` | ✅ |
