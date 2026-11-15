import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { createApp } from '../../src/app.js';

let directory: string;
let server: Server;
let base: string;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'regmeup-frontend-test-'));
  await writeFile(join(directory, 'index.html'), '<!doctype html><title>synthetic frontend</title>');
  await mkdir(join(directory, 'api'));
  await writeFile(join(directory, 'api', 'hidden.txt'), 'must not be exposed');
  server = createApp(async () => undefined, undefined, directory).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No HTTP address');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('built frontend routing', () => {
  it('serves the SPA for client routes but never for API routes', async () => {
    const page = await fetch(`${base}/organizer/events`);
    expect(page.status).toBe(200); expect(await page.text()).toContain('synthetic frontend');
    for (const path of ['/api/missing', '/api/hidden.txt', '/API/hidden.txt']) {
      const response = await fetch(`${base}${path}`);
      expect(response.status).toBe(404); expect(await response.text()).not.toContain('synthetic frontend');
    }
  });
});
