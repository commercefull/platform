import { incrementQueryCounter, startQueryCounterContext } from './queryCounter';

describe('libs/db/queryCounter', () => {
  it('is a no-op outside a counter context', () => {
    expect(() => incrementQueryCounter('SELECT 1')).not.toThrow();
  });

  it('counts queries and records their text inside a context', () => {
    const state = startQueryCounterContext(() => {
      incrementQueryCounter('SELECT * FROM "order"');
      incrementQueryCounter('SELECT * FROM "customer"');
    });
    expect(state.count).toBe(2);
    expect(state.queries).toEqual(['SELECT * FROM "order"', 'SELECT * FROM "customer"']);
  });

  it('truncates recorded SQL to 200 chars', () => {
    const longSql = `SELECT ${'x'.repeat(500)}`;
    const state = startQueryCounterContext(() => incrementQueryCounter(longSql));
    expect(state.queries[0].length).toBe(200);
  });

  it('caps the recorded query list at 200 entries while still counting', () => {
    const state = startQueryCounterContext(() => {
      for (let i = 0; i < 210; i++) incrementQueryCounter(`SELECT ${i}`);
    });
    expect(state.count).toBe(210);
    expect(state.queries.length).toBe(200);
  });

  it('isolates state between contexts', () => {
    const a = startQueryCounterContext(() => incrementQueryCounter('SELECT 1'));
    const b = startQueryCounterContext(() => {
      incrementQueryCounter('SELECT 1');
      incrementQueryCounter('SELECT 2');
    });
    expect(a.count).toBe(1);
    expect(b.count).toBe(2);
  });
});
