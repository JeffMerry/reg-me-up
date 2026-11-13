import { describe, expect, it } from 'vitest';
import { checkAppliedMigrations, sha256 } from '../../src/migration-history.js';

describe('applied migration history', () => {
  const original = 'SELECT 1;\n';
  const applied = [{ migration_name: '20261111000000_initial', checksum: sha256(original), finished_at: new Date(), rolled_back_at: null }];
  const files = new Map([['20261111000000_initial', original]]);

  it('accepts unchanged applied migrations and pending new files', () => {
    expect(() => checkAppliedMigrations(applied, files)).not.toThrow();
    expect(() => checkAppliedMigrations(applied, new Map([...files, ['next', 'SELECT 2;']]))).not.toThrow();
  });
  it('rejects an edited or missing applied migration', () => {
    expect(() => checkAppliedMigrations(applied, new Map([['20261111000000_initial', `${original}-- altered\n`]]))).toThrow();
    expect(() => checkAppliedMigrations(applied, new Map())).toThrow();
  });
  it('rejects unfinished non-rolled-back migrations and permits resolved rollback entries', () => {
    expect(() => checkAppliedMigrations([{ ...applied[0], finished_at: null }], files)).toThrow();
    expect(() => checkAppliedMigrations([{ ...applied[0], finished_at: null, rolled_back_at: new Date() }], files)).not.toThrow();
  });
});
