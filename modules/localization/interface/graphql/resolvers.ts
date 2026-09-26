import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ConvertCurrencyInput } from '../../application/useCases/ConvertCurrency';
import { CreateCurrencyInput } from '../../application/useCases/CreateCurrency';
import { CreateLocaleInput } from '../../application/useCases/CreateLocale';
import { SetExchangeRateInput } from '../../application/useCases/SetExchangeRate';
import {
  convertCurrencyUseCase,
  createCurrencyUseCase,
  createLocaleUseCase,
  setExchangeRateUseCase,
} from '../../application/wired';

export const localizationResolvers = {
  Query: {
    convertCurrency: async (_parent: unknown, args: { input: ConvertCurrencyInput }) => {
      return convertCurrencyUseCase.execute(args.input);
    },
  },

  Mutation: {
    createCurrency: async (_parent: unknown, args: { input: CreateCurrencyInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return createCurrencyUseCase.execute(args.input);
    },

    createLocale: async (_parent: unknown, args: { input: CreateLocaleInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return createLocaleUseCase.execute(args.input);
    },

    setExchangeRate: async (_parent: unknown, args: { input: SetExchangeRateInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: SetExchangeRateInput = {
        ...args.input,
        effectiveDate: args.input.effectiveDate ? new Date(args.input.effectiveDate) : undefined,
      };
      return setExchangeRateUseCase.execute(input);
    },
  },
};
