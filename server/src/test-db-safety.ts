export type DatabaseIdentity = { host: string; port: number; database: string };

// Reset tooling must obtain identities from both live connections and verify an
// explicit test-only marker. Never trust URL string differences or DNS aliases.
export function assertDistinctTestDatabase(app: DatabaseIdentity | null, test: DatabaseIdentity | null, hasTestMarker: boolean): void {
  if (!app || !test || !hasTestMarker || !app.host || !test.host || !app.database || !test.database || !app.port || !test.port) throw new Error('Unsafe test database target');
  // Fail closed for different endpoints: equivalence cannot be established here.
  if (app.host !== test.host || app.port !== test.port || app.database === test.database) throw new Error('Unsafe test database target');
}

interface Queryable {
  query(sql: string): Promise<{ rows: Array<Record<string, unknown>> }>;
}

// Connections are supplied by the caller. Refuse any cleanup when either
// identity or the explicitly installed test-only marker cannot be verified.
export async function verifyTestDatabase(appClient: Queryable, testClient: Queryable): Promise<void> {
  const identity = async (client: Queryable): Promise<DatabaseIdentity> => {
    const result = await client.query('SELECT inet_server_addr()::text AS host, inet_server_port() AS port, current_database() AS database');
    const row = result.rows[0];
    if (!row || typeof row.host !== 'string' || typeof row.port !== 'number' || typeof row.database !== 'string') throw new Error('Unsafe test database target');
    return { host: row.host, port: row.port, database: row.database };
  };
  try {
    const app = await identity(appClient);
    const test = await identity(testClient);
    const marker = await testClient.query("SELECT marker FROM regmeup_test_guard WHERE marker = 'regmeup-isolated-test'");
    assertDistinctTestDatabase(app, test, marker.rows.length === 1);
  } catch {
    throw new Error('Unsafe test database target');
  }
}

// The caller owns the cleanup operation; no reset endpoint or automatic reset
// is provided. Verification always completes before the callback can run.
export async function withVerifiedTestDatabase<T>(appClient: Queryable, testClient: Queryable, operation: (verifiedTestClient: Queryable) => Promise<T>): Promise<T> {
  await verifyTestDatabase(appClient, testClient);
  return operation(testClient);
}
