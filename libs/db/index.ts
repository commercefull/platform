import { query as poolQuery, queryOne as poolQueryOne } from './pool';
import { query as clientQuery, queryOne as clientQueryOne } from './client';
export { withTransaction } from './transaction';
export type { TxClient } from './transaction';
export { runWithQueryCounter, runWithQueryCounterAsync, startQueryCounterContext, getQueryCount } from './queryCounter';

export const query = async <T>(text: string, params?: Array<unknown>): Promise<T | null> => {
  if (process.env.SERVERLESS === '1') {
    clientQuery(text, params);
  }

  return poolQuery(text, params);
};

export const queryOne = async <T>(text: string, params?: Array<unknown>): Promise<T | null> => {
  if (process.env.SERVERLESS === '1') {
    return clientQueryOne(text, params || []);
  }

  return poolQueryOne(text, params || []);
};
