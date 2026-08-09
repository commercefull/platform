export const localizationTypeDefs = `#graphql
  type ConvertCurrencyResult {
    originalAmount: Float!
    originalCurrency: String!
    convertedAmount: Float!
    targetCurrency: String!
    exchangeRate: Float!
    convertedAt: String!
  }

  type CreateCurrencyResult {
    currencyId: String!
    code: String!
    name: String!
    symbol: String!
    exchangeRate: Float!
    isDefault: Boolean!
    createdAt: String!
  }

  type CreateLocaleResult {
    localeId: String!
    code: String!
    name: String!
    isDefault: Boolean!
    isActive: Boolean!
    createdAt: String!
  }

  type SetExchangeRateResult {
    currencyCode: String!
    previousRate: Float!
    newRate: Float!
    effectiveDate: String!
    updatedAt: String!
  }

  input ConvertCurrencyInput {
    amount: Float!
    fromCurrency: String!
    toCurrency: String!
  }

  input CreateCurrencyInput {
    code: String!
    name: String!
    symbol: String!
    symbolPosition: String
    decimalPlaces: Int
    decimalSeparator: String
    thousandsSeparator: String
    exchangeRate: Float
    isDefault: Boolean
    isActive: Boolean
  }

  input CreateLocaleInput {
    code: String!
    name: String!
    nativeName: String
    direction: String
    dateFormat: String
    timeFormat: String
    isDefault: Boolean
    isActive: Boolean
  }

  input SetExchangeRateInput {
    currencyCode: String!
    exchangeRate: Float!
    effectiveDate: String
    source: String
  }

  type Query {
    convertCurrency(input: ConvertCurrencyInput!): ConvertCurrencyResult!
  }

  type Mutation {
    createCurrency(input: CreateCurrencyInput!): CreateCurrencyResult!
    createLocale(input: CreateLocaleInput!): CreateLocaleResult!
    setExchangeRate(input: SetExchangeRateInput!): SetExchangeRateResult!
  }
`;
