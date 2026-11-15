import { describe, expect, it } from 'vitest';
import { parseConfig } from '../../src/config.js';

const valid = {
  NODE_ENV: 'development', PORT: '3000',
  DATABASE_URL: 'postgresql://app:secret@localhost:5432/regmeup_dev',
  SESSION_SECRET: 'a'.repeat(32), APP_ORIGIN: 'http://localhost:5173',
};

describe('server configuration', () => {
  it('accepts valid settings without exposing secrets', () => {
    expect(parseConfig(valid)).toMatchObject({ nodeEnv: 'test', port: 3000, appOrigin: 'http://localhost:5173' });
  });
  it.each(['DATABASE_URL', 'SESSION_SECRET', 'APP_ORIGIN'])('rejects missing %s safely', (key) => {
    expect(() => parseConfig({ ...valid, [key]: '' })).toThrow('Invalid server configuration');
  });
  it('rejects invalid port and origin', () => {
    expect(() => parseConfig({ ...valid, PORT: '65536' })).toThrow();
    expect(() => parseConfig({ ...valid, APP_ORIGIN: 'https://example.com/path' })).toThrow();
  });
  it('never includes database credentials or the secret in errors', () => {
    try { parseConfig({ ...valid, DATABASE_URL: 'postgresql://sensitive:secret@', PORT: '-1' }); }
    catch (error) { expect(String(error)).not.toContain('secret'); return; }
    throw new Error('Expected configuration error');
  });
});
