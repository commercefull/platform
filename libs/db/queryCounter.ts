/* eslint-disable @typescript-eslint/no-unused-vars */
import { AsyncLocalStorage } from 'node:async_hooks';

interface QueryCounterState {
  count: number;
  queries: string[];
}

const queryCounterStorage = new AsyncLocalStorage<QueryCounterState>();

/**
 * Start a query counter context. All `query` / `queryOne` / `withTransaction`
 * calls within `fn` will increment the counter. Returns the state object,
 * which is mutated asynchronously as queries execute.
 *
 * The callback `fn` is called synchronously within the ALS context; async
 * continuations triggered by `fn` (e.g. Express `next()`) inherit the context.
 */
export const startQueryCounterContext = (fn: () => void): QueryCounterState => {
  const state: QueryCounterState = { count: 0, queries: [] };
  queryCounterStorage.run(state, fn);
  return state;
};

/**
 * Start a query counter context. All `query` / `queryOne` / `withTransaction`
 * calls within `fn` will increment the counter. Returns the final state.
 */
const runWithQueryCounter = <T>(fn: () => T): { result: T; count: number; queries: string[] } => {
  const state: QueryCounterState = { count: 0, queries: [] };
  const result = queryCounterStorage.run(state, fn);
  return { result, count: state.count, queries: state.queries };
};

/**
 * Async variant — awaits `fn` and returns the final state.
 */
const runWithQueryCounterAsync = async <T>(fn: () => Promise<T>): Promise<{ result: T; count: number; queries: string[] }> => {
  const state: QueryCounterState = { count: 0, queries: [] };
  const result = await queryCounterStorage.run(state, fn);
  return { result, count: state.count, queries: state.queries };
};

/**
 * Increment the active query counter by 1 and record the SQL text (truncated).
 * No-op when no counter context is active (production requests, CLI jobs, etc.).
 */
export const incrementQueryCounter = (sqlText: string): void => {
  const state = queryCounterStorage.getStore();
  if (!state) return;
  state.count++;
  if (state.queries.length < 200) {
    state.queries.push(sqlText.slice(0, 200));
  }
};

/**
 * Get the current query count, or 0 if no counter context is active.
 */
const getQueryCount = (): number => {
  return queryCounterStorage.getStore()?.count ?? 0;
};
