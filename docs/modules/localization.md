# Localization Feature

## Overview

The Localization feature manages multi-language support and regional settings. It enables content translation, locale-specific formatting, and internationalization of the storefront.

---

## Use Cases

### Language Management (Business)

### UC-LOC-001: List Languages (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request languages  
**Then** the system returns configured languages

#### API Endpoint

```
GET /business/localization/languages
```

---

### UC-LOC-002: Create Language (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid language configuration  
**When** they add a language  
**Then** content can be translated to that language

#### API Endpoint

```
POST /business/localization/languages
Body: {
  code: 'en'|'es'|'fr'|'de'|...,
  name,
  nativeName,
  isDefault?,
  isActive
}
```

#### Business Rules

- ISO 639-1 language codes
- One default language required
- Fallback to default if translation missing

---

### UC-LOC-003: Update Language (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/localization/languages/:code
```

---

### UC-LOC-004: Delete Language (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/localization/languages/:code
```

---

### Translation Management (Business)

### UC-LOC-005: List Translations (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request translations  
**Then** the system returns translation keys and values

#### API Endpoint

```
GET /business/localization/translations
Query: languageCode, namespace?, search?, limit, offset
```

---

### UC-LOC-006: Get Translation (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/localization/translations/:key
Query: languageCode
```

---

### UC-LOC-007: Create/Update Translation (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a translation key and value  
**When** they save the translation  
**Then** the translation is stored

#### API Endpoint

```
PUT /business/localization/translations/:key
Body: { languageCode, value, namespace? }
```

---

### UC-LOC-008: Delete Translation (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/localization/translations/:key
Query: languageCode
```

---

### UC-LOC-009: Import Translations (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** a translation file (JSON/CSV)  
**When** importing translations  
**Then** all translations are bulk created/updated

#### API Endpoint

```
POST /business/localization/translations/import
Body: { languageCode, translations: {} }
```

---

### UC-LOC-010: Export Translations (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/localization/translations/export
Query: languageCode, format: 'json'|'csv'
```

---

### Locale Settings (Business)

### UC-LOC-011: List Locales (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/localization/locales
```

---

### UC-LOC-012: Create Locale (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** locale configuration  
**When** they create a locale  
**Then** regional formatting is available

#### API Endpoint

```
POST /business/localization/locales
Body: {
  code: 'en-US'|'en-GB'|'es-ES'|...,
  languageCode,
  currencyCode,
  dateFormat,
  timeFormat,
  numberFormat: { decimal, thousands },
  isActive
}
```

---

### UC-LOC-013: Update Locale (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
PUT /business/localization/locales/:code
```

---

### UC-LOC-014: Delete Locale (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/localization/locales/:code
```

---

### Customer-Facing Use Cases

### UC-LOC-015: Get Available Languages (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### API Endpoint

```
GET /localization/languages
```

---

### UC-LOC-016: Get Translations (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a language code  
**When** requesting translations  
**Then** the system returns all translations for that language

#### API Endpoint

```
GET /localization/translations/:languageCode
Query: namespace?
```

---

### UC-LOC-017: Detect Locale (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** browser headers or IP  
**When** detecting locale  
**Then** the system suggests appropriate locale

#### API Endpoint

```
GET /localization/detect
```

---

## Events Emitted

| Event                                | Trigger             | Payload             |
| ------------------------------------ | ------------------- | ------------------- |
| `localization.language.added`        | Language added      | languageCode        |
| `localization.translation.updated`   | Translation updated | key, languageCode   |
| `localization.translations.imported` | Bulk import         | languageCode, count |

---

## Integration Test Coverage

| Use Case                 | Test File                           | Status |
| ------------------------ | ----------------------------------- | ------ |
| UC-LOC-001 to UC-LOC-004 | `localization/languages.test.ts`    | ❌     |
| UC-LOC-005 to UC-LOC-010 | `localization/translations.test.ts` | ❌     |
| UC-LOC-011 to UC-LOC-014 | `localization/locales.test.ts`      | ❌     |
| UC-LOC-015 to UC-LOC-017 | `localization/customer.test.ts`     | ❌     |
