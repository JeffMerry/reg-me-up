import { describe, expect, it } from 'vitest';
import { assertDistinctTestDatabase, verifyTestDatabase, withVerifiedTestDatabase } from '../../src/test-db-safety.js';

const app = { host: '127.0.0.1', port: 5432, database: 'regmeup' };
const test = { host: '127.0.0.1', port: 5432, database: 'regmeup_test' };

describe('test database reset guard', () => {
  it('requires independent verified server identities and test marker', () => {
    expect(() => assertDistinctTestDatabase(app, test, true)).not.toThrow();
    expect(() => assertDistinctTestDatabase(app, test, false)).toThrow();
    expect(() => assertDistinctTestDatabase(app, null, true)).toThrow();
  });
  it('rejects the same effective database even when connection URLs differ', () => {
    expect(() => assertDistinctTestDatabase(app, { ...app }, true)).toThrow();
  });
  it('fails closed when server identity is not comparable', () => {
    expect(() => assertDistinctTestDatabase(app, { ...test, host: '' }, true)).toThrow();
    expect(() => assertDistinctTestDatabase(app, { ...test, host: '::1' }, true)).toThrow();
  });
  it('reads both effective identities and refuses a missing marker', async () => {
    const client = (database: string, marker: boolean) => ({ query: async (sql: string) => ({ rows: sql.includes('current_database') ? [{ host: '127.0.0.1', port: 5432, database }] : marker ? [{ marker: 'regmeup-isolated-test' }] : [] }) });
    await expect(verifyTestDatabase(client('app', true), client('test', true))).resolves.toBeUndefined();
    await expect(verifyTestDatabase(client('app', true), client('test', false))).rejects.toThrow('Unsafe test database target');
    await expect(verifyTestDatabase(client('app', true), client('app', true))).rejects.toThrow('Unsafe test database target');
  });
  it('does not run cleanup when target verification fails', async () => {
    const same = { query: async () => ({ rows: [{ host: '127.0.0.1', port: 5432, database: 'same' }] }) };
    let called = false;
    await expect(withVerifiedTestDatabase(same, same, async () => { called = true; })).rejects.toThrow();
    expect(called).toBe(false);
  });
});
