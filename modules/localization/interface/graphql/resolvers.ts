import * as CurrencyRepo from '../../infrastructure/repositories/currencyRepo';
import LocaleRepo from '../../infrastructure/repositories/localeRepo';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ConvertCurrencyUseCase, ConvertCurrencyInput } from '../../application/useCases/ConvertCurrency';
import { CreateCurrencyUseCase, CreateCurrencyInput } from '../../application/useCases/CreateCurrency';
import { CreateLocaleUseCase, CreateLocaleInput } from '../../application/useCases/CreateLocale';
import { SetExchangeRateUseCase, SetExchangeRateInput } from '../../application/useCases/SetExchangeRate';

export const localizationResolvers = {
  Query: {
    convertCurrency: async (_parent: unknown, args: { input: ConvertCurrencyInput }) => {
      const useCase = new ConvertCurrencyUseCase(CurrencyRepo as never);
      return useCase.execute(args.input);
    },
  },

  Mutation: {
    createCurrency: async (_parent: unknown, args: { input: CreateCurrencyInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateCurrencyUseCase(CurrencyRepo as never);
      return useCase.execute(args.input);
    },

    createLocale: async (_parent: unknown, args: { input: CreateLocaleInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateLocaleUseCase(LocaleRepo as never);
      return useCase.execute(args.input);
    },

    setExchangeRate: async (_parent: unknown, args: { input: SetExchangeRateInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new SetExchangeRateUseCase(CurrencyRepo as never);
      const input: SetExchangeRateInput = {
        ...args.input,
        effectiveDate: args.input.effectiveDate ? new Date(args.input.effectiveDate) : undefined,
      };
      return useCase.execute(input);
    },
  },
};
