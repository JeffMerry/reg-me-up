import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../../src/app.js';

let server: Server | undefined;
afterEach(async () => { if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve())); server = undefined; });

describe('health endpoint', () => {
  it.each([[true, 200, 'ok'], [false, 503, 'unavailable']] as const)('reports database readiness without leaking errors', async (available, status, result) => {
    server = createApp(async () => { if (!available) throw new Error('private connection details'); }).listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No HTTP address');
    for (const path of ['/api/health', '/api/ready']) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ status: result });
    }
  });
});
